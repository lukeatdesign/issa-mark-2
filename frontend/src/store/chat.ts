import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/types";

type ChatMode = "companion" | "consultant";

export const GENERAL_THREAD_ID = "general";

interface ChatState {
  activeThreadId: string;
  threads: Record<string, ChatMessage[]>;
  conversationId: string | null;
  mode: ChatMode;
  loading: boolean;
  setConversationId: (id: string) => void;
  setActiveThreadId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  addMessageToThread: (threadId: string, msg: ChatMessage) => void;
  updateMessageFeedback: (messageId: string, feedback: 1 | -1) => void;
  appendCorrectionAttempt: (messageId: string, correction: string) => void;
  setMode: (mode: ChatMode) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

function mapMessageInThreads(
  threads: Record<string, ChatMessage[]>,
  messageId: string,
  mapFn: (m: ChatMessage) => ChatMessage
): Record<string, ChatMessage[]> | null {
  for (const tid of Object.keys(threads)) {
    const list = threads[tid];
    const idx = list.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = mapFn(next[idx]!);
      return { ...threads, [tid]: next };
    }
  }
  return null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      activeThreadId: GENERAL_THREAD_ID,
      threads: { [GENERAL_THREAD_ID]: [] },
      conversationId: null,
      mode: "companion",
      loading: false,

      setConversationId: (id) => set({ conversationId: id }),

      setActiveThreadId: (id) =>
        set((state) => ({
          activeThreadId: id,
          threads:
            state.threads[id] !== undefined
              ? state.threads
              : { ...state.threads, [id]: [] },
        })),

      addMessage: (msg) =>
        set((state) => {
          const id = state.activeThreadId;
          const cur = state.threads[id] ?? [];
          return {
            threads: { ...state.threads, [id]: [...cur, msg] },
          };
        }),

      addMessageToThread: (threadId, msg) =>
        set((state) => {
          const cur = state.threads[threadId] ?? [];
          return {
            threads: { ...state.threads, [threadId]: [...cur, msg] },
          };
        }),

      updateMessageFeedback: (messageId, feedback) =>
        set((state) => {
          const nextThreads = mapMessageInThreads(
            state.threads,
            messageId,
            (m) => ({ ...m, feedback })
          );
          return nextThreads ? { threads: nextThreads } : state;
        }),

      appendCorrectionAttempt: (messageId, correction) =>
        set((state) => {
          const nextThreads = mapMessageInThreads(
            state.threads,
            messageId,
            (m) => ({
              ...m,
              correction_attempt: correction,
            })
          );
          return nextThreads ? { threads: nextThreads } : state;
        }),

      setMode: (mode) => set({ mode }),
      setLoading: (loading) => set({ loading }),

      reset: () =>
        set({
          activeThreadId: GENERAL_THREAD_ID,
          threads: { [GENERAL_THREAD_ID]: [] },
          conversationId: null,
          loading: false,
        }),
    }),
    {
      name: "issa_chat_threads",
      partialize: (s) => ({
        threads: s.threads,
        activeThreadId: s.activeThreadId,
      }),
    }
  )
);
