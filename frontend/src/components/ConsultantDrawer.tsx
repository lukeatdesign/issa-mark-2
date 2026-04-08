"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import type { ChatMessage } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── diff modal ────────────────────────────────────────────────────────────────

function DiffModal({
  before,
  after,
  onClose,
}: {
  before: string;
  after: string;
  onClose: () => void;
}) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const beforeSet = new Set(beforeLines);

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-[680px] flex flex-col" style={{ maxHeight: "85vh" }}>

        {/* Header — fixed, never scrolls */}
        <div className="flex-shrink-0 flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-base">AI prompt updated!</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                The assistant just got smarter from this conversation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — only this part scrolls */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            What changed
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Lines highlighted in teal are new or changed.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Before */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Prompt before
              </p>
              <div className="rounded-xl bg-gray-100 border border-gray-200 overflow-y-auto max-h-[300px] p-3">
                {beforeLines.map((line, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">
                    {line || "\u00a0"}
                  </p>
                ))}
              </div>
            </div>

            {/* After */}
            <div>
              <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1.5">
                Prompt after
              </p>
              <div className="rounded-xl bg-teal-50 border border-teal-200 overflow-y-auto max-h-[300px] p-3">
                {afterLines.map((line, i) => {
                  const isNew = line.trim() !== "" && !beforeSet.has(line);
                  return (
                    <p
                      key={i}
                      className={`text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                        isNew
                          ? "border-l-2 border-teal-500 pl-2 text-teal-900 bg-teal-100/60"
                          : "text-teal-800 pl-2"
                      }`}
                    >
                      {line || "\u00a0"}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer — fixed, never scrolls */}
        <div className="flex-shrink-0 px-6 pt-3 pb-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">
            Powered by /improve-ai · Changes saved to Supabase
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            Got it →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── error toast ───────────────────────────────────────────────────────────────

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium bg-red-600 text-white">
      ✕ {message}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

export default function ConsultantDrawer({ open, onClose, messages }: Props) {
  const [consultantReply, setConsultantReply] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [beforePrompt, setBeforePrompt] = useState("");
  const [afterPrompt, setAfterPrompt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch current prompt when drawer opens
  useEffect(() => {
    if (!open) return;
    setAfterPrompt(null); // reset modal on every open
    axios
      .get(`${BASE_URL}/get-prompt`)
      .then((res) => setBeforePrompt(res.data?.prompt ?? ""))
      .catch(() => setBeforePrompt("(Could not load current prompt)"));
  }, [open]);

  // Escape key closes drawer (but not modal — modal has its own close buttons)
  useEffect(() => {
    if (!open || afterPrompt !== null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, afterPrompt, onClose]);

  // Only strip error bubbles — user messages permanently carry "temp-" IDs
  const realMessages = messages.filter((m) => !m.id.startsWith("err-"));
  const hasExchange = realMessages.length >= 2;

  const lastUserMsg = [...realMessages].reverse().find((m) => m.role === "user");
  const lastAiMsg = [...realMessages].reverse().find((m) => m.role === "assistant");

  const handleImprove = async () => {
    if (!lastUserMsg) return;
    const replyText = consultantReply.trim() || (textareaRef.current?.value.trim() ?? "");
    if (!replyText) return;

    if (!consultantReply.trim() && replyText) {
      setConsultantReply(replyText);
    }

    setIsImproving(true);
    try {
      const historyBeforeLast = realMessages
        .filter((m) => m.id !== lastUserMsg.id && !m.id.startsWith("err-"))
        .map((m) => ({
          role: (m.role === "assistant" ? "consultant" : "user") as "user" | "consultant",
          content: m.content,
        }));

      const res = await axios.post(`${BASE_URL}/improve-ai`, {
        clientSequence: lastUserMsg.content,
        chatHistory: historyBeforeLast,
        consultantReply: replyText,
      });

      const newPrompt =
        res.data?.updatedPrompt ??
        res.data?.newPrompt ??
        res.data?.prompt ??
        res.data?.updated_prompt ??
        "";

      onClose(); // dismiss drawer before mounting modal to avoid stacking context conflicts
      setAfterPrompt(newPrompt);
      setConsultantReply("");
      if (textareaRef.current) textareaRef.current.value = "";
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <>
      {/* Error toast — only for failures; success is shown in the modal */}
      {errorMsg && (
        <ErrorToast message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      )}

      {/* Success diff modal */}
      {afterPrompt !== null && (
        <DiffModal
          before={beforePrompt}
          after={afterPrompt}
          onClose={() => setAfterPrompt(null)}
        />
      )}

      {/* Drawer wrapper — invisible + pointer-events-none when closed */}
      <div
        className={`fixed inset-0 z-50 ${
          open ? "pointer-events-auto" : "pointer-events-none invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Drawer panel */}
        <div
          aria-hidden={!open}
          className={`absolute top-0 right-0 h-full w-[480px] max-w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <AcademicCapIcon className="w-4 h-4 text-gray-500 shrink-0" />
              Consultant view
            </h2>
              <p className="text-xs text-gray-400 mt-0.5">Improve the AI from this conversation</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Improve this AI
            </h3>

            {!hasExchange ? (
              <p className="text-sm text-gray-400 italic">
                Have a conversation first, then come back here to improve the AI.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Last exchange preview */}
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">User said:</p>
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                      {lastUserMsg?.content}
                    </p>
                  </div>
                  <div className="bg-brand-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-brand-400 mb-1">AI replied:</p>
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                      {lastAiMsg?.content}
                    </p>
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Better consultant reply
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={consultantReply}
                    onChange={(e) => setConsultantReply(e.target.value)}
                    placeholder="How would a real Issa consultant respond to this message?"
                    rows={5}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={isImproving || !consultantReply.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isImproving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Improving…
                    </>
                  ) : (
                    "Improve AI prompt →"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
