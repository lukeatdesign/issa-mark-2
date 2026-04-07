-- ============================================================
-- Issa Compass — Initial Schema
-- Run in Supabase SQL Editor (or via Supabase CLI migrations)
-- ============================================================

-- Enable pgvector for knowledge base similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  nationality  text,
  role         text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'consultant', 'admin')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- User Profiles (quiz answers + derived path)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  quiz_answers jsonb,
  derived_path text,
  urgency      text,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Immigration Paths
-- ============================================================
CREATE TABLE IF NOT EXISTS paths (
  id               text PRIMARY KEY,
  label            text NOT NULL,
  description      text,
  target_personas  text[]
);

-- ============================================================
-- Steps within each path
-- ============================================================
CREATE TABLE IF NOT EXISTS steps (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id            text REFERENCES paths(id) ON DELETE CASCADE,
  order_index        int NOT NULL,
  title              text NOT NULL,
  description        text,
  why_it_matters     text,
  estimated_time     text,
  required_documents text[],
  official_links     text[],
  tips               text[],
  dependent_on       uuid[]
);

-- ============================================================
-- Per-user step progress
-- ============================================================
CREATE TABLE IF NOT EXISTS user_step_progress (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE,
  step_id    uuid REFERENCES steps(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'blocked')),
  notes      text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_id)
);

-- ============================================================
-- Chat Conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Chat Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user', 'assistant')),
  content         text NOT NULL,
  feedback        int  CHECK (feedback IN (-1, 1)),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- User Memory Facts
-- ============================================================
CREATE TABLE IF NOT EXISTS user_memory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users ON DELETE CASCADE,
  memory_type text NOT NULL CHECK (memory_type IN ('fact', 'preference', 'concern')),
  content     text NOT NULL,
  source      text NOT NULL DEFAULT 'inferred' CHECK (source IN ('user_stated', 'inferred', 'consultant_override')),
  confidence  float NOT NULL DEFAULT 1.0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Feedback Log (AI self-correction pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id       uuid REFERENCES messages(id) ON DELETE SET NULL,
  user_id          uuid REFERENCES auth.users ON DELETE CASCADE,
  question         text,
  ai_answer        text,
  corrected_answer text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'self_corrected', 'consultant_reviewed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Knowledge Base (consultant-approved answers + pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic             text,
  path_id           text REFERENCES paths(id) ON DELETE SET NULL,
  question_embedding vector(1536),
  question          text NOT NULL,
  canonical_answer  text NOT NULL,
  source            text NOT NULL DEFAULT 'consultant' CHECK (source IN ('consultant', 'self_corrected')),
  approved_by       uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- pgvector similarity search function
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding  vector(1536),
  match_threshold  float,
  match_count      int
)
RETURNS TABLE (
  id               uuid,
  question         text,
  canonical_answer text,
  source           text,
  similarity       float
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    question,
    canonical_answer,
    source,
    1 - (question_embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE question_embedding IS NOT NULL
    AND 1 - (question_embedding <=> query_embedding) > match_threshold
  ORDER BY question_embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_step_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_log          ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- User profiles: own data only
CREATE POLICY "user_profiles_own" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Step progress: own data only
CREATE POLICY "step_progress_own" ON user_step_progress
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: own only
CREATE POLICY "conversations_own" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- Messages: accessible via conversation ownership
CREATE POLICY "messages_own" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- User memory: own only
CREATE POLICY "memory_own" ON user_memory
  FOR ALL USING (auth.uid() = user_id);

-- Feedback log: own only
CREATE POLICY "feedback_own" ON feedback_log
  FOR ALL USING (auth.uid() = user_id);

-- Paths and steps are public-readable
ALTER TABLE paths  ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paths_read" ON paths  FOR SELECT USING (true);
CREATE POLICY "steps_read" ON steps  FOR SELECT USING (true);

-- Knowledge base: public read (consultant write handled by service role)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_read" ON knowledge_base FOR SELECT USING (true);
