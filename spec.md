# Thailand Work Immigration Assistant — Project Spec
> A full-stack AI-powered app helping immigrants navigate working in Thailand across blue-collar, white-collar, and digital nomad paths.

---

## 1. Project Overview

### Vision
An intelligent, empathetic immigration companion that meets users where they are — whether they're a factory worker from Myanmar figuring out their first work permit, a software engineer evaluating a Bangkok job offer, or a freelancer exploring a Long-Term Resident visa. The app guides users through complex, document-heavy processes with clarity, confidence, and a human touch.

### Core Philosophy
- **Emotion-first**: Detect where the user is in their journey (exploring / actively applying / urgent situation) and adapt accordingly.
- **Progressive disclosure**: Don't overwhelm. Surface only what's relevant to the user's specific path.
- **Trust through transparency**: Always show *why* a step matters, not just *what* to do.
- **Living knowledge**: The system learns from user outcomes and consultant overrides — it gets smarter over time.

---

## 2. User Personas

| Persona | Description | Entry Mode |
|---|---|---|
| **The Worker** | Blue-collar migrant (Myanmar, Laos, Cambodia). Limited Thai/English. Relies on agents or employers. Needs simple, visual guidance. | Quiz onboarding → Stepper |
| **The Professional** | White-collar expat (ASEAN, Western). Company-sponsored. Needs WP + Non-B visa clarity, tax implications. | Quiz onboarding → Stepper + Chatbot |
| **The Nomad** | Remote worker / freelancer. Evaluating LTR, SMART Visa, or TR60 + border run. Needs nuanced risk/legality clarity. | Chatbot-first or Quiz → Chatbot |

---

## 3. Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand (client state) + React Query (server state)
- **Fonts**: Lora (display) / DM Sans (body) — consistent with Issa Compass brand

### Backend
- **Framework**: Flask (Python)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Deployment**: Railway

### Database
- **Provider**: Supabase (Postgres)
- **Auth**: Supabase Auth (email/magic link)
- **Storage**: Supabase Storage (for document uploads, future feature)

### Infrastructure
- **Frontend Deploy**: Vercel
- **Backend Deploy**: Railway
- **Environment**: `.env.local` (frontend), `.env` (backend)

---

## 4. Information Architecture

```
/                          → Landing page
/onboarding                → Quiz-style onboarding flow
/dashboard                 → User dashboard (post-onboarding)
/dashboard/roadmap         → Personalized stepper / checklist
/dashboard/chat            → Chatbot interface
/dashboard/documents       → Document checklist (future)
/admin                     → Consultant / supervisor panel (protected)
/admin/overrides           → Review & correct AI-generated answers
/admin/knowledge           → View/edit knowledge base entries
```

---

## 5. Feature Specifications

---

### 5.1 Quiz-Style Onboarding

**Purpose**: Understand the user's situation, nationality, work type, urgency, and current status. Build a personalized profile that drives all downstream features.

**UX Pattern**: One question per screen, progress bar, back navigation always available.

**Question Flow**:

```
Q1: What brings you to Thailand?
    → Work for a company here
    → Work remotely for a company abroad
    → Start my own business
    → Just exploring options

Q2: What kind of work will you do?
    → Manual / factory / construction / agriculture
    → Professional / office / technical
    → Creative / freelance / digital

Q3: What's your nationality?
    → [Dropdown: ASEAN countries prioritized, then global]
    → Special handling flags: Myanmar, Laos, Cambodia (MOU routes), 
      EU/US/AU (BOI fast-track eligibility)

Q4: Do you have a job offer in Thailand yet?
    → Yes, from a Thai company
    → Yes, from a foreign company with Thai presence
    → No, still looking
    → I'm self-employed / freelance

Q5: What's your current visa status in Thailand?
    → Not in Thailand yet
    → Tourist visa / visa exempt
    → Non-B (Business) visa
    → Other (specify via chatbot)

Q6: How urgent is your situation?
    → Just exploring, no rush
    → Planning to move in 1–3 months
    → I need to sort this out urgently (< 1 month)
```

**Output**: A `user_profile` object stored in Supabase:
```json
{
  "intent": "work_company",
  "work_type": "professional",
  "nationality": "US",
  "has_job_offer": true,
  "current_visa": "tourist",
  "urgency": "planning",
  "derived_path": "non_b_to_wp_professional"
}
```

**Derived Path Logic** (backend): Map quiz answers → one of ~10 canonical immigration paths. This drives the stepper content.

---

### 5.2 Personalized Stepper (Roadmap)

**Purpose**: Give users a clear, linear checklist of everything they need to do, customized to their path.

**UX Pattern**: Vertical stepper with expandable step details. Steps can be:
- ✅ Completed (user-marked)
- 🔄 In Progress
- ⏳ Upcoming
- ⚠️ Blocked (dependency not met)

**Step Structure**:
```
Step {
  id: string
  title: string
  description: string
  why_it_matters: string          // "Because..." — builds trust
  estimated_time: string          // e.g. "3–5 business days"
  required_documents: string[]    
  official_links: string[]        
  tips: string[]                  // Practical gotchas
  dependent_on: step_id[]         // Unlock logic
  status: "pending" | "in_progress" | "done" | "blocked"
}
```

**Example Path** — `non_b_to_wp_professional`:
1. Confirm your Non-B visa is valid (or apply at Thai consulate in home country)
2. Employer submits Work Permit application at Department of Employment
3. Collect Work Permit at DoE (in person, with employer rep)
4. Register with Revenue Department (TIN / tax ID)
5. Open Thai bank account
6. Annual renewal reminder setup

**Data**: Stepper content stored in Supabase `paths` and `steps` tables. Consultants can edit via `/admin/knowledge`.

---

### 5.3 Chatbot Assistant

**Purpose**: Handle everything the stepper can't — nuanced questions, edge cases, emotional support, and full conversation-driven guidance for users who prefer it over structured flows.

**Modes**:
- **Companion mode** (default): Friendly, empathetic, contextually aware of user's profile
- **Consultant mode** (power users): More detailed, technical, cites regulations

**Context Injection**: Every chat session receives:
```python
system_prompt = f"""
You are an expert Thailand immigration assistant. 
You are helping a user with the following profile:
{user_profile_json}

Their current roadmap progress:
{roadmap_progress_json}

Respond with empathy and clarity. If unsure, say so honestly.
When answering procedural questions, cite the relevant Thai law or 
regulation when possible (e.g. Alien Working Act B.E. 2551).
Never give legal advice — recommend consulting a licensed advisor 
for complex legal situations.
"""
```

**Conversation Modes** (user-selectable):
- Chat guides me step by step (structured)
- I'll ask questions freely (open)

**Features**:
- Multi-turn conversation with full history
- Suggested follow-up chips after each AI response
- "Was this helpful?" thumbs up/down on each message
- Ability to escalate: "Talk to a real consultant" → captures intent

---

### 5.4 Persistent Memory System

**Purpose**: The chatbot remembers what users have shared across sessions and learns from feedback signals.

#### 5.4.1 User Memory (per-user)

Stored in `user_memory` table. Updated after each conversation turn.

```sql
CREATE TABLE user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  memory_type text,           -- 'fact' | 'preference' | 'concern'
  content text,               -- e.g. "User's employer is Accenture Thailand"
  source text,                -- 'user_stated' | 'inferred' | 'consultant_override'
  confidence float,           -- 0.0–1.0
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Memory extraction**: After each AI response, a lightweight background call extracts structured facts from the conversation turn:
```
"User mentioned their employer is Accenture Thailand" → stored as fact
"User seems anxious about timeline" → stored as concern
"User prefers detailed explanations" → stored as preference
```

These are injected into future system prompts as: `Known facts about this user: [...]`

#### 5.4.2 Self-Learning from Feedback

When user thumbs-down a response:
1. The Q&A pair is flagged in `feedback_log` table
2. AI attempts a self-correction: regenerates answer with `[CORRECTION ATTEMPT]` tag
3. If user approves correction → the improved Q&A pair is stored in `knowledge_corrections`
4. Future similar questions incorporate this correction via RAG-lite pattern (embedding similarity search in Postgres using `pgvector`)

#### 5.4.3 Consultant Override

Consultants access `/admin/overrides` to:
- View flagged Q&A pairs awaiting review
- Write the canonical correct answer
- Tag it with relevant visa path / topic
- Approve → stored in `knowledge_base` with `source: 'consultant'`

Consultant-approved answers are **always preferred** over AI-generated answers when a semantic match is found (cosine similarity > 0.85).

---

### 5.5 Admin / Consultant Panel

**Access**: `/admin` — protected by Supabase Auth role check (`user.role = 'consultant'`)

**Panels**:

| Panel | Description |
|---|---|
| **Overrides Queue** | Flagged AI answers needing human review. Write canonical answer, approve/reject. |
| **Knowledge Base** | CRUD for step content, tips, document lists, official links per immigration path. |
| **User Insights** | Anonymous aggregated: most common questions, highest drop-off steps, top concerns. |
| **Path Editor** | Add/edit/reorder steps within any immigration path. |

---

## 6. Database Schema

```sql
-- Users (managed by Supabase Auth, extended below)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  display_name text,
  nationality text,
  role text DEFAULT 'user',   -- 'user' | 'consultant' | 'admin'
  created_at timestamptz DEFAULT now()
);

-- Onboarding quiz answers + derived profile
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE,
  quiz_answers jsonb,
  derived_path text,
  urgency text,
  updated_at timestamptz DEFAULT now()
);

-- Immigration paths (e.g. "non_b_to_wp_professional")
CREATE TABLE paths (
  id text PRIMARY KEY,
  label text,
  description text,
  target_personas text[]
);

-- Steps within each path
CREATE TABLE steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id text REFERENCES paths(id),
  order_index int,
  title text,
  description text,
  why_it_matters text,
  estimated_time text,
  required_documents text[],
  official_links text[],
  tips text[],
  dependent_on uuid[]
);

-- Per-user step progress
CREATE TABLE user_step_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  step_id uuid REFERENCES steps(id),
  status text DEFAULT 'pending',  -- pending | in_progress | done | blocked
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Chat conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id),
  role text,          -- 'user' | 'assistant'
  content text,
  feedback int,       -- NULL | 1 (thumbs up) | -1 (thumbs down)
  created_at timestamptz DEFAULT now()
);

-- Extracted user memory facts
CREATE TABLE user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  memory_type text,
  content text,
  source text,
  confidence float DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI answer feedback log (for self-learning)
CREATE TABLE feedback_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id),
  user_id uuid REFERENCES auth.users,
  question text,
  ai_answer text,
  corrected_answer text,
  status text DEFAULT 'pending',  -- pending | self_corrected | consultant_reviewed
  created_at timestamptz DEFAULT now()
);

-- Consultant-approved knowledge
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  path_id text,
  question_embedding vector(1536),   -- pgvector
  question text,
  canonical_answer text,
  source text,       -- 'consultant' | 'self_corrected'
  approved_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);
```

---

## 7. API Endpoints (Flask Backend)

### Chat
```
POST /chat
Body: { conversation_id, user_id, message, mode }
Returns: { reply, suggested_followups, memory_updates }

POST /chat/feedback
Body: { message_id, feedback: 1 | -1 }
Returns: { correction_attempt? }
```

### Profile & Onboarding
```
POST /onboarding/submit
Body: { user_id, quiz_answers }
Returns: { derived_path, user_profile }

GET /profile/:user_id
Returns: { profile, memory_facts[] }
```

### Roadmap
```
GET /roadmap/:user_id
Returns: { path, steps[], progress }

PATCH /roadmap/step
Body: { user_id, step_id, status }
Returns: { updated_step }
```

### Admin
```
GET /admin/overrides
Returns: { flagged_items[] }

POST /admin/overrides/:id/approve
Body: { canonical_answer, consultant_id }

GET /admin/knowledge
POST /admin/knowledge
PATCH /admin/knowledge/:id
DELETE /admin/knowledge/:id
```

---

## 8. Frontend Component Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing
│   ├── onboarding/
│   │   └── page.tsx                # Quiz flow (Zustand state machine)
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + nav
│   │   ├── page.tsx                # Overview / summary
│   │   ├── roadmap/
│   │   │   └── page.tsx            # Stepper view
│   │   └── chat/
│   │       └── page.tsx            # Chatbot interface
│   └── admin/
│       ├── layout.tsx              # Role-protected layout
│       ├── overrides/page.tsx
│       └── knowledge/page.tsx
├── components/
│   ├── onboarding/
│   │   ├── QuizShell.tsx           # Progress bar + navigation shell
│   │   ├── QuizQuestion.tsx        # Single question card
│   │   └── QuizOption.tsx          # Selectable option button
│   ├── roadmap/
│   │   ├── StepperList.tsx         # Full stepper container
│   │   ├── StepCard.tsx            # Expandable step item
│   │   └── StepStatus.tsx          # Status badge + icon
│   ├── chat/
│   │   ├── ChatWindow.tsx          # Message list container
│   │   ├── ChatBubble.tsx          # Individual message bubble
│   │   ├── ChatInput.tsx           # Input + send button
│   │   ├── SuggestedChips.tsx      # Follow-up suggestion pills
│   │   └── FeedbackButtons.tsx     # 👍 👎 per message
│   └── shared/
│       ├── AuthGuard.tsx
│       └── RoleGuard.tsx           # Consultant/admin protection
├── lib/
│   ├── supabase.ts                 # Supabase client
│   ├── api.ts                      # Flask API client (axios/fetch wrapper)
│   └── quiz-logic.ts               # Path derivation from quiz answers
├── store/
│   ├── onboarding.ts               # Zustand: quiz state machine
│   ├── roadmap.ts                  # Zustand: step progress
│   └── chat.ts                     # Zustand: conversation state
└── types/
    └── index.ts                    # Shared TypeScript types
```

---

## 9. Immigration Path Catalog (Initial Seed Data)

| Path ID | Label | Trigger Conditions |
|---|---|---|
| `mou_worker` | MOU Migrant Worker | Nationality: MM/LA/KH + work_type: manual |
| `non_b_to_wp_professional` | Non-B Visa + Work Permit (Employee) | work_type: professional + has_job_offer: true |
| `non_b_self_employed` | Non-B Visa + Work Permit (Own Company) | intent: own_business |
| `ltr_visa` | Long-Term Resident (LTR) Visa | work_type: digital + remote_employer: true |
| `smart_visa` | SMART Visa | work_type: professional + BOI-eligible employer |
| `digital_nomad_grey` | Digital Nomad (Grey Area / TR60) | intent: remote + urgency: exploring |
| `border_run_strategy` | Visa Exempt Extension Strategy | current_visa: exempt + urgency: urgent |
| `non_o_dependent` | Dependent / Spouse of Thai National | special: thai_spouse |

---

## 10. Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=https://your-railway-app.up.railway.app
```

### Backend (`.env`)
```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FLASK_ENV=production
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

---

## 11. Non-Functional Requirements

- **Multilingual**: UI strings must use i18n keys from day one. Priority languages: English, Thai, Burmese, Lao.
- **Mobile-first**: Quiz and stepper must be fully usable on mobile. Chat interface must feel native on mobile.
- **Accessibility**: All interactive elements keyboard-navigable. Color contrast AA minimum.
- **Data Privacy**: User quiz data and memory facts are private by default. Never expose one user's data to another. Consultant access is role-gated and audited.
- **Honest AI**: Chatbot must never fabricate visa rules. When uncertain, it must say so and suggest official sources (e.g. `dol.go.th`, `boi.go.th`).

---

## 12. Out of Scope (v1)

- Document OCR / upload analysis
- Real-time consultant chat (live human handoff)
- Payment / service booking
- Employer-side portal
- Push notifications

---

## 13. Development Phases

### Phase 1 — Foundation
- [ ] Project scaffolding (Next.js + Flask + Supabase)
- [ ] Supabase Auth (email magic link)
- [ ] Database schema migration
- [ ] Quiz onboarding flow (frontend + path derivation logic)
- [ ] Basic stepper (hardcoded paths for 2–3 paths)

### Phase 2 — Intelligence
- [ ] Chatbot with user profile context injection
- [ ] Persistent memory extraction + storage
- [ ] Thumbs up/down feedback + self-correction loop
- [ ] Knowledge base lookup (pre-consultant phase: manual seed data)

### Phase 3 — Consultant Layer
- [ ] Admin panel with role protection
- [ ] Override queue + canonical answer approval
- [ ] pgvector similarity search for KB lookup
- [ ] Anonymous analytics dashboard

### Phase 4 — Scale
- [ ] i18n (Burmese, Thai, Lao)
- [ ] Mobile optimization pass
- [ ] Performance audit
- [ ] Additional immigration paths

---

*Spec version: 1.0 — Last updated: April 2026*
*Author: Luka @ IBMDT*
