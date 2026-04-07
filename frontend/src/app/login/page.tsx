"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";
import { useChatStore } from "@/store/chat";
import { useChatTaskPanelStore } from "@/store/chatTaskPanel";
import api from "@/lib/api";

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

export default function LoginPage() {
  const router = useRouter();
  const { lastUsername, setAuth } = useAuthStore();
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const resetChat = useChatStore((s) => s.reset);
  const resetTaskPanel = useChatTaskPanelStore((s) => s.setGeneralHelp);

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
      const incomingUsername = res.data.username;

      // Always clear in-memory chat + task panel (Zustand survives client-side navigation)
      resetChat();
      resetTaskPanel();
      // If a different user than last time, also wipe their persisted app data
      if (lastUsername && lastUsername !== incomingUsername) {
        APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        resetOnboarding();
      }

      setAuth(res.data.token, incomingUsername);
      router.replace("/dashboard");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl text-brand-900">Issa Compass</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
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
        </form>
      </div>
    </div>
  );
}
