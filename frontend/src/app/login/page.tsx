"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";
import { useChatStore } from "@/store/chat";
import { useChatTaskPanelStore } from "@/store/chatTaskPanel";
import api from "@/lib/api";

const APP_STORAGE_KEYS = [
  "wayfarer_roadmap",
  "wayfarer_overview_cache",
  "wayfarer_docs_count",
  "wayfarer_active_task",
  "wayfarer_documents_checklist",
  "wayfarer_status_demo",
  "wayfarer_chat_task_panel",
  "wayfarer_chat_threads",
  "wayfarer_subtask_progress",
];


// ── Sign In form ──────────────────────────────────────────────────────────────
function SignInForm({ onSwitchTab, onSuccess }: { onSwitchTab: () => void; onSuccess: (token: string, username: string, dest: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/login", { username: username.trim(), password });
      onSuccess(res.data.token, res.data.username, "/dashboard/chat");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="test01"
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          required
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password}
        className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitchTab} className="text-brand-600 font-medium hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}

// ── Sign Up form ──────────────────────────────────────────────────────────────
function SignUpForm({
  onSwitchTab,
  onSuccess,
}: {
  onSwitchTab: () => void;
  onSuccess: (token: string, username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/register", { username: username.trim(), password });
      onSuccess(res.data.token, res.data.username);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter your password"
          required
          minLength={6}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !username || !password || !confirm}
        className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        No email verification — this is a demo project.
      </p>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchTab} className="text-brand-600 font-medium hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── Proceeding screen ─────────────────────────────────────────────────────────
function ProceedingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5 animate-fade-in">
      <span className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-base font-semibold text-gray-900">Taking you to your guide…</p>
        <p className="text-sm text-gray-500 leading-relaxed">Ask further questions or share more details to generate your personalized roadmap.</p>
      </div>
    </div>
  );
}

// ── Inner page (needs Suspense for useSearchParams) ───────────────────────────
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lastUsername, setAuth } = useAuthStore();
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const resetChat = useChatStore((s) => s.reset);
  const resetTaskPanel = useChatTaskPanelStore((s) => s.setGeneralHelp);

  const [tab, setTab] = useState<"signin" | "signup">(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );
  const [proceeding, setProceeding] = useState(false);

  const handleProceed = (dest: string) => {
    setProceeding(true);
    setTimeout(() => router.replace(dest), 2500);
  };

  const handleSignInSuccess = (token: string, username: string, dest: string) => {
    resetChat();
    resetTaskPanel();
    if (lastUsername && lastUsername !== username) {
      APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      resetOnboarding();
    }
    setAuth(token, username);
    handleProceed(dest);
  };

  const handleSignUpSuccess = (token: string, username: string) => {
    resetChat();
    resetTaskPanel();
    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    resetOnboarding();
    setAuth(token, username);
    router.replace("/onboarding");
  };

  if (proceeding) return <ProceedingScreen />;

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-brand-900">Wayfarer</h1>
            <p className="text-sm text-gray-500 mt-1">
              {tab === "signin" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 bg-white p-1 mb-6">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "signin"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === "signup"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8">
            {tab === "signin" ? (
              <SignInForm onSwitchTab={() => setTab("signup")} onSuccess={handleSignInSuccess} />
            ) : (
              <SignUpForm
                onSwitchTab={() => setTab("signin")}
                onSuccess={handleSignUpSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
