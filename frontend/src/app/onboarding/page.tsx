"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import QuizShell from "@/components/onboarding/QuizShell";
import QuizQuestion from "@/components/onboarding/QuizQuestion";
import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { useChatTaskPanelStore } from "@/store/chatTaskPanel";
import type { Intent, WorkType, JobOffer, CurrentVisa, Urgency } from "@/types";

const QUESTIONS = [
  {
    key: "intent",
    question: "What brings you to Thailand?",
    options: [
      { value: "work_company", label: "Work for a company here" },
      { value: "work_remote", label: "Work remotely for a company abroad" },
      { value: "own_business", label: "Start my own business" },
      { value: "exploring", label: "Just exploring options" },
    ],
  },
  {
    key: "work_type",
    question: "What kind of work will you do?",
    options: [
      { value: "manual", label: "Manual / factory / construction / agriculture" },
      { value: "professional", label: "Professional / office / technical" },
      { value: "creative", label: "Creative / freelance / digital" },
    ],
  },
  {
    key: "nationality",
    question: "What's your nationality?",
    subtitle: "This helps us route you to the right visa pathway.",
    options: [],
    isDropdown: true,
  },
  {
    key: "has_job_offer",
    question: "Do you have a job offer in Thailand yet?",
    options: [
      { value: "yes_thai", label: "Yes, from a Thai company" },
      { value: "yes_foreign", label: "Yes, from a foreign company with Thai presence" },
      { value: "no", label: "No, still looking" },
      { value: "self_employed", label: "I'm self-employed / freelance" },
    ],
  },
  {
    key: "current_visa",
    question: "What's your current visa status in Thailand?",
    options: [
      { value: "none", label: "Not in Thailand yet" },
      { value: "tourist", label: "Tourist visa / visa exempt" },
      { value: "non_b", label: "Non-B (Business) visa" },
      { value: "other", label: "Other — I'll explain in the chat" },
    ],
  },
  {
    key: "urgency",
    question: "How urgent is your situation?",
    options: [
      { value: "exploring", label: "Just exploring, no rush" },
      { value: "planning", label: "Planning to move in 1–3 months" },
      { value: "urgent", label: "I need to sort this out urgently (< 1 month)" },
    ],
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];

// ── Registration modal ────────────────────────────────────────────────────────
function RegisterModal({
  onSuccess,
}: {
  onSuccess: (token: string, username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/register", {
        username: username.trim(),
        password,
      });
      onSuccess(res.data.token, res.data.username);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-display font-semibold text-gray-900">
            Create your account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Save your roadmap and continue your journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
              required
              minLength={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              "Create account →"
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          No email verification needed — this is a demo account.
        </p>
      </div>
    </div>
  );
}

const APP_STORAGE_KEYS = [
  "issa_roadmap",
  "issa_overview_cache",
  "issa_docs_count",
  "issa_active_task",
  "issa_documents_checklist",
  "issa_status_demo",
  "issa_chat_task_panel",
  "issa_chat_threads",
  "issa_subtask_progress",
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, answers, setAnswer, nextStep, prevStep, totalSteps } =
    useOnboardingStore();
  const { isLoggedIn, lastUsername, setAuth, clearAuth } = useAuthStore();
  const resetChat = useChatStore((s) => s.reset);
  const resetTaskPanel = useChatTaskPanelStore((s) => s.setGeneralHelp);
  const [submitting, setSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const question = QUESTIONS[currentStep];
  const currentAnswer = answers[question.key as keyof typeof answers];
  const canGoNext = Boolean(currentAnswer);
  const isLastStep = currentStep === totalSteps - 1;

  const handleSelect = (value: string) => {
    setAnswer(
      question.key as QuestionKey,
      value as Intent & WorkType & JobOffer & CurrentVisa & Urgency & string
    );
  };

  const handleNext = async () => {
    if (!isLastStep) {
      nextStep();
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    setSubmitting(false);
    // Already logged in (came from dashboard redirect) → go straight to chat
    if (isLoggedIn) {
      router.push("/dashboard/chat");
      return;
    }
    // Guest → show registration modal
    setShowRegister(true);
  };

  const handleExitOnboarding = () => {
    if (isLoggedIn) {
      clearAuth();
    }
    router.replace("/");
  };

  const exitAction =
    currentStep === 0
      ? {
          label: isLoggedIn ? "Sign Out" : "Cancel",
          onClick: handleExitOnboarding,
        }
      : undefined;

  const handleRegistered = (token: string, username: string) => {
    // Always clear in-memory chat + task panel (Zustand survives client-side navigation)
    resetChat();
    resetTaskPanel();
    // If registering as a different user than last session, wipe their persisted data
    if (lastUsername && lastUsername !== username) {
      APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    setAuth(token, username);
    router.push("/dashboard/chat");
  };

  return (
    <>
      <QuizShell
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={prevStep}
        onNext={handleNext}
        canGoNext={canGoNext}
        isLastStep={isLastStep}
        isSubmitting={submitting}
        exitAction={exitAction}
      >
        <QuizQuestion
          question={question.question}
          subtitle={"subtitle" in question ? question.subtitle : undefined}
          options={"options" in question ? [...question.options] : []}
          selectedValue={currentAnswer as string | undefined}
          onSelect={handleSelect}
          isDropdown={"isDropdown" in question ? question.isDropdown : false}
        />
      </QuizShell>

      {showRegister && <RegisterModal onSuccess={handleRegistered} />}
    </>
  );
}
