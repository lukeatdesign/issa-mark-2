/**
 * Flask API client wrapper.
 * Automatically attaches the Supabase session token as Bearer auth.
 */
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({ baseURL: BASE_URL });

export type ChatHistoryItem = { role: "user" | "consultant"; message: string };

export type RoadmapTask = {
  id: number;
  task: string;
  detail: string;
  subtasks: string[];
  canAutomate: boolean;
  automationHint: string | null;
  status: "available" | "blocked" | "in_progress";
  priority: "urgent" | "high" | "normal";
  blockedBy: string | null;
  done: boolean;
};

export type RoadmapData = {
  userName: string | null;
  visaType: string;
  timeline: string;
  estimatedDays: number;
  userTasks: RoadmapTask[];
  employerTasks: RoadmapTask[];
};

export type QuizAnswers = {
  intent?: string;
  work_type?: string;
  nationality?: string;
  has_job_offer?: string;
  current_visa?: string;
  urgency?: string;
  notes?: string;
};

export async function generateReply(
  clientSequence: string,
  chatHistory: ChatHistoryItem[],
  quizAnswers?: QuizAnswers
): Promise<string> {
  const res = await api.post("/generate-reply", {
    clientSequence,
    chatHistory,
    quizAnswers: quizAnswers ?? {},
  });
  return res.data.aiReply;
}

export async function generateRoadmap(
  chatHistory: ChatHistoryItem[],
  quizAnswers?: QuizAnswers
): Promise<RoadmapData> {
  const res = await api.post("/generate-roadmap", { chatHistory, quizAnswers: quizAnswers ?? {} });
  return res.data;
}

export default api;
