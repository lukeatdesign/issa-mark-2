// ============================================================
// Shared TypeScript types — Wayfarer
// ============================================================

export type UserRole = "user" | "consultant" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  nationality: string | null;
  role: UserRole;
  created_at: string;
}

// Quiz & Onboarding ----------------------------------------

export type Intent = "work_company" | "work_remote" | "own_business" | "exploring";
export type WorkType = "manual" | "professional" | "creative";
export type JobOffer = "yes_thai" | "yes_foreign" | "no" | "self_employed";
export type CurrentVisa = "none" | "tourist" | "non_b" | "other";
export type Urgency = "exploring" | "planning" | "urgent";

export interface QuizAnswers {
  /** User's first name (optional — skippable). */
  name?: string;
  intent?: Intent;
  work_type?: WorkType;
  nationality?: string;
  has_job_offer?: JobOffer;
  current_visa?: CurrentVisa;
  urgency?: Urgency;
  special?: string;
  /** Free-text context accumulated from chat messages and manual edits. */
  notes?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  quiz_answers: QuizAnswers;
  derived_path: string;
  urgency: Urgency | null;
  updated_at: string;
}

// Roadmap / Steps ------------------------------------------

export type StepStatus = "pending" | "in_progress" | "done" | "blocked";

export interface Step {
  id: string;
  path_id: string;
  order_index: number;
  title: string;
  description: string;
  why_it_matters: string;
  estimated_time: string;
  required_documents: string[];
  official_links: string[];
  tips: string[];
  dependent_on: string[];
  // Merged from user_step_progress
  status: StepStatus;
  notes: string | null;
}

export interface Path {
  id: string;
  label: string;
  description: string;
  target_personas: string[];
}

export interface RoadmapData {
  path: Path;
  steps: Step[];
}

// Chat -----------------------------------------------------

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  feedback: 1 | -1 | null;
  created_at: string;
  // Ephemeral (not stored in DB)
  suggested_followups?: string[];
  correction_attempt?: string;
}

/** Snapshot of a roadmap task for the chat side panel (persisted across navigation). */
export interface ChatActiveTask {
  /** Matches `RoadmapTask.id` when chosen from the roadmap */
  roadmapTaskId?: number;
  /** Required with `roadmapTaskId` for stable storage (ids may overlap between user / employer lists). */
  taskSection?: "user" | "employer";
  task: string;
  detail: string;
  subtasks: string[];
  status: "available" | "blocked" | "in_progress";
  blockedBy: string | null;
  canAutomate: boolean;
  automationHint: string | null;
  priority?: "urgent" | "high" | "normal";
}

// Memory ---------------------------------------------------

export type MemoryType = "fact" | "preference" | "concern";

export interface MemoryFact {
  memory_type: MemoryType;
  content: string;
  confidence: number;
}

// Admin ----------------------------------------------------

export interface FeedbackLogItem {
  id: string;
  message_id: string;
  user_id: string;
  question: string;
  ai_answer: string;
  corrected_answer: string | null;
  status: "pending" | "self_corrected" | "consultant_reviewed";
  created_at: string;
}

export interface KnowledgeBaseItem {
  id: string;
  topic: string;
  path_id: string | null;
  question: string;
  canonical_answer: string;
  source: "consultant" | "self_corrected";
  created_at: string;
}
