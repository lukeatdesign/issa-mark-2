"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useChatStore, GENERAL_THREAD_ID } from "@/store/chat";
import {
  createTaskIntroMessage,
  readRoadmapFromStorage,
  resolveTaskChatThreadId,
} from "@/lib/taskChatIntro";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import { generateReply, generateRoadmap } from "@/lib/api";
import type { RoadmapData } from "@/lib/api";
import { useOnboardingStore, isOnboardingComplete } from "@/store/onboarding";
import ConsultantDrawer from "@/components/ConsultantDrawer";
import type { ChatMessage } from "@/types";
import { AcademicCapIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import TaskPanel from "@/components/chat/TaskPanel";
import RoadmapContextPanel from "@/components/chat/RoadmapContextPanel";
import ChatThreadSidebar from "@/components/chat/ChatThreadSidebar";
import { derivePath, PATH_LABELS } from "@/lib/quiz-logic";
import { deriveGeneralSuggestions, deriveTaskSuggestions } from "@/lib/suggestions";
import { useChatTaskPanelStore } from "@/store/chatTaskPanel";
import type { ChatActiveTask } from "@/types";

export default function ChatPage() {
  const messages = useChatStore((s) => s.threads[s.activeThreadId] ?? []);
  const generalMessages = useChatStore(
    (s) => s.threads[GENERAL_THREAD_ID] ?? []
  );
  const loading = useChatStore((s) => s.loading);
  const addMessage = useChatStore((s) => s.addMessage);
  const addMessageToThread = useChatStore((s) => s.addMessageToThread);
  const setActiveThreadId = useChatStore((s) => s.setActiveThreadId);
  const setLoading = useChatStore((s) => s.setLoading);
  const quizAnswers = useOnboardingStore((s) => s.answers);
  const setQuizAnswer = useOnboardingStore((s) => s.setAnswer);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const helpMode = useChatTaskPanelStore((s) => s.helpMode);
  const activeTask = useChatTaskPanelStore((s) => s.activeTask);
  const panelExpanded = useChatTaskPanelStore((s) => s.panelExpanded);
  const setTaskPayload = useChatTaskPanelStore((s) => s.setTaskPayload);
  const setTaskFromRoadmap = useChatTaskPanelStore((s) => s.setTaskFromRoadmap);
  const setGeneralHelp = useChatTaskPanelStore((s) => s.setGeneralHelp);
  const setPanelExpanded = useChatTaskPanelStore((s) => s.setPanelExpanded);
  const setThreadMeta    = useChatStore((s) => s.setThreadMeta);

  // ── Auto-welcome on first visit after quiz (wait for persisted onboarding) ─
  const welcomeFired = useRef(false);
  const [onboardingHydrated, setOnboardingHydrated] = useState(false);

  useEffect(() => {
    const unsub = useOnboardingStore.persist.onFinishHydration(() =>
      setOnboardingHydrated(true)
    );
    if (useOnboardingStore.persist.hasHydrated()) setOnboardingHydrated(true);
    return unsub;
  }, []);

  const [chatHydrated, setChatHydrated] = useState(false);
  useEffect(() => {
    const unsub = useChatStore.persist.onFinishHydration(() =>
      setChatHydrated(true)
    );
    if (useChatStore.persist.hasHydrated()) setChatHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("issa_roadmap");
      if (raw) setRoadmap(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!onboardingHydrated || !chatHydrated) return;
    if (welcomeFired.current) return;
    if (generalMessages.length > 0) return;
    if (!isOnboardingComplete(quizAnswers)) return;

    welcomeFired.current = true;

    const { nationality, intent } = quizAnswers;

    // Derive the user's immigration path from quiz answers
    const path = derivePath(quizAnswers);
    const pathLabel = PATH_LABELS[path] ?? path;

    // Get a readable nationality label (e.g. "MM" → "Myanmar")
    let natLabel = nationality;
    try {
      natLabel = new Intl.DisplayNames(["en"], { type: "region" }).of(nationality.toUpperCase()) ?? nationality;
    } catch { /* browser may not support — fall back to code */ }

    // Build intent phrase
    const intentPhrases: Record<string, string> = {
      work_company: "you're planning to work for a company in Thailand",
      work_remote: "you'll be working remotely for a company abroad",
      own_business: "you're planning to start your own business here",
      exploring: "you're exploring your options in Thailand",
    };
    const intentPhrase = intentPhrases[intent ?? ""] ?? "you're planning to work in Thailand";

    const welcome =
      `Hi! I'm Compass, your AI immigration guide.\n\n` +
      `Based on what you've told me — you're from **${natLabel}** and ${intentPhrase} — ` +
      `it looks like the **${pathLabel}** route is right for you.\n\n` +
      `I'll walk you through every step, from paperwork to having everything in order. ` +
      `What would you like to know first?`;

    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      conversation_id: "",
      role: "assistant",
      content: welcome,
      feedback: null,
      created_at: new Date().toISOString(),
    };
    addMessageToThread(GENERAL_THREAD_ID, welcomeMsg);
  }, [onboardingHydrated, chatHydrated, quizAnswers, generalMessages.length, addMessageToThread]);

  useEffect(() => {
    if (!chatHydrated) return;
    const raw = localStorage.getItem("issa_active_task");
    if (!raw) return;
    localStorage.removeItem("issa_active_task");

    try {
      const t = JSON.parse(raw) as {
        roadmapTaskId?: number;
        taskSection?: "user" | "employer";
        task: string;
        detail: string;
        subtasks: string[];
        status: "available" | "blocked" | "in_progress";
        blockedBy: string | null;
        canAutomate: boolean;
        automationHint: string | null;
      };

      const payload: ChatActiveTask = {
        roadmapTaskId: t.roadmapTaskId,
        taskSection: t.taskSection,
        task: t.task,
        detail: t.detail,
        subtasks: t.subtasks ?? [],
        status: t.status,
        blockedBy: t.blockedBy ?? null,
        canAutomate: t.canAutomate,
        automationHint: t.automationHint ?? null,
      };

      const taskThreadId = resolveTaskChatThreadId(payload, readRoadmapFromStorage());
      const injected = createTaskIntroMessage(payload);
      useChatStore.getState().addMessageToThread(taskThreadId, injected);
      setTaskPayload(payload);
    } catch {
      // corrupted payload — ignore
    }
  }, [chatHydrated, setTaskPayload]);

  const resolvedThreadId = useMemo(() => {
    if (helpMode === "general" || !activeTask) return GENERAL_THREAD_ID;
    const roadmapForKey =
      roadmap ??
      (typeof window !== "undefined" ? readRoadmapFromStorage() : null);
    return resolveTaskChatThreadId(activeTask, roadmapForKey);
  }, [helpMode, activeTask, roadmap]);

  useEffect(() => {
    setActiveThreadId(resolvedThreadId);
  }, [resolvedThreadId, setActiveThreadId]);

  /** First assistant message for each task thread when switching tasks (panel or roadmap). */
  useEffect(() => {
    if (!chatHydrated) return;
    if (helpMode !== "task" || !activeTask) return;
    if (resolvedThreadId === GENERAL_THREAD_ID) return;

    const state = useChatStore.getState();
    const existing = state.threads[resolvedThreadId] ?? [];
    if (existing.length > 0) return;

    const intro = createTaskIntroMessage(activeTask);
    state.addMessageToThread(resolvedThreadId, intro);
  }, [chatHydrated, helpMode, activeTask, resolvedThreadId]);

  const assistantCount = generalMessages.filter(
    (m) => m.role === "assistant"
  ).length;
  const userText = generalMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  // ── Readiness signals: quiz answers take priority over chat text ───────────
  // Quiz-derived (structured, reliable)
  const quizHasNationality = !!quizAnswers.nationality;
  const quizHasTimeline    = !!quizAnswers.urgency;
  const quizHasEmployer    = !!quizAnswers.has_job_offer;
  const quizComplete       = quizHasNationality && quizHasTimeline && quizHasEmployer;

  // Chat-derived (regex fallback for users who skipped onboarding)
  const chatHasNationality =
    /\bi'?m?\s+from\b|i am from|i('m| am) [a-z]+ese\b|my (nationality|passport|country)/i.test(userText);
  const chatHasTimeline =
    /\b(week|month|start date|when|soon|days|deadline|timeline|by [a-z]+)\b/.test(userText);
  const chatHasEmployer =
    /\b(company|employer|hr|sponsor|offer|job|hired|work permit|boss|manager)\b/.test(userText);

  const hasNationality    = quizHasNationality || chatHasNationality;
  const hasTimeline       = quizHasTimeline    || chatHasTimeline;
  const hasEmployerContext = quizHasEmployer   || chatHasEmployer;

  // Minimum real exchanges: quiz users need 3 assistant replies (welcome + 2 real answers),
  // non-quiz users need 5. The auto-welcome counts as 1, so quiz users must ask ≥2 questions.
  const minReplies = quizComplete ? 3 : 5;
  const chatReady  = assistantCount >= minReplies;

  // ── Register thread metadata whenever a task thread becomes active ────────
  useEffect(() => {
    if (helpMode !== "task" || !activeTask) return;
    if (resolvedThreadId === GENERAL_THREAD_ID) return;
    setThreadMeta(resolvedThreadId, {
      name: activeTask.task,
      task: activeTask,
      createdAt: new Date().toISOString(),
    });
  }, [resolvedThreadId, helpMode, activeTask, setThreadMeta]);

  // ── Thread selection from sidebar ─────────────────────────────────────────
  const handleSelectThread = (threadId: string) => {
    if (threadId === GENERAL_THREAD_ID) {
      setGeneralHelp();
      return;
    }
    const meta = useChatStore.getState().threadMeta[threadId];
    if (meta?.task) setTaskPayload(meta.task);
  };

  // ── Inject suggested chips into the last assistant message ───────────────
  const displayMessages = useMemo(() => {
    if (loading) return messages;

    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { lastAssistantIdx = i; break; }
    }
    if (lastAssistantIdx === -1) return messages;

    const suggestions =
      helpMode === "task" && activeTask
        ? deriveTaskSuggestions(messages, activeTask)
        : deriveGeneralSuggestions(messages, quizAnswers);

    if (!suggestions.length) return messages;

    return messages.map((m, i) =>
      i === lastAssistantIdx ? { ...m, suggested_followups: suggestions } : m
    );
  }, [messages, loading, helpMode, activeTask, quizAnswers]);

  const buildHistory = () =>
    generalMessages
      .filter((m) => !m.id.startsWith("temp-") && !m.id.startsWith("err-"))
      .map((m) => ({
        role: (m.role === "assistant" ? "consultant" : "user") as "user" | "consultant",
        content: m.content,
      }));

  const handleGenerateRoadmap = async (answersOverride?: typeof quizAnswers) => {
    setRoadmapLoading(true);
    try {
      const answers = answersOverride ?? quizAnswers;
      const result = await generateRoadmap(buildHistory(), answers);
      localStorage.setItem("issa_roadmap", JSON.stringify(result));
      setRoadmap(result);
    } catch {
      // silent
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleUpdateAnswers = (newAnswers: typeof quizAnswers) => {
    // Write each key into the Zustand onboarding store so the readiness
    // signals re-evaluate on the next render.
    (Object.entries(newAnswers) as [keyof typeof newAnswers, string][]).forEach(
      ([key, value]) => {
        if (value) setQuizAnswer(key as never, value as never);
      }
    );
  };

  const handleRegenerateWithNewContext = async (newAnswers: typeof quizAnswers) => {
    handleUpdateAnswers(newAnswers);
    setRoadmapLoading(true);
    try {
      const newRoadmap = await generateRoadmap(buildHistory(), newAnswers);

      // Preserve done-state for tasks whose name still exists in the new roadmap
      const previousRoadmap = roadmap;
      if (previousRoadmap) {
        const doneTasks = new Set(
          previousRoadmap.userTasks
            .filter((t) => t.done)
            .map((t) => t.task.toLowerCase().trim())
        );
        newRoadmap.userTasks = newRoadmap.userTasks.map((t) => ({
          ...t,
          done: doneTasks.has(t.task.toLowerCase().trim()),
        }));
      }

      localStorage.setItem("issa_roadmap", JSON.stringify(newRoadmap));
      setRoadmap(newRoadmap);
    } catch {
      // silent
    } finally {
      setRoadmapLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || loading) return;

    setInputValue("");

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: "",
      role: "user",
      content,
      feedback: null,
      created_at: new Date().toISOString(),
    };
    addMessage(tempUserMsg);
    setLoading(true);

    // Accumulate user message into notes for richer roadmap context
    const currentNotes = quizAnswers.notes ?? "";
    setQuizAnswer("notes" as never, (currentNotes ? `${currentNotes}\n${content}` : content) as never);

    try {
      const history = messages
        .filter((m) => !m.id.startsWith("temp-") && !m.id.startsWith("err-"))
        .map((m) => ({
          role: (m.role === "assistant" ? "consultant" : "user") as "user" | "consultant",
          content: m.content,
        }));

      const reply = await generateReply(content, history, quizAnswers);

      addMessage({
        id: `ai-${Date.now()}`,
        conversation_id: "",
        role: "assistant",
        content: reply,
        feedback: null,
        created_at: new Date().toISOString(),
      });
    } catch {
      addMessage({
        id: `err-${Date.now()}`,
        conversation_id: "",
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        feedback: null,
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const showRoadmapContext = helpMode === "general";
  const taskPanelKey =
    activeTask?.roadmapTaskId != null
      ? `t-${activeTask.roadmapTaskId}`
      : activeTask?.task ?? "general";

  return (
    <div className="flex h-screen min-h-0">

      {/* ── Thread navigator ────────────────────────────────────────────────── */}
      <ChatThreadSidebar onSelectThread={handleSelectThread} />

      {/* ── Chat column ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">Chat with Compass</h1>
            <p className="text-xs text-gray-400">
              {helpMode === "task" && activeTask
                ? `Helping with: ${activeTask.task}`
                : "Your AI immigration guide"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <AcademicCapIcon className="w-4 h-4 mr-1 inline-block" />
            Consultant view
          </button>
        </div>

        <ChatWindow
          messages={displayMessages}
          loading={loading}
          onChipSelect={(text) => sendMessage(text)}
        />

        {/* Roadmap context — when not focused on a specific roadmap step */}
        {showRoadmapContext && (
          <RoadmapContextPanel
            hasNationality={hasNationality}
            hasTimeline={hasTimeline}
            hasEmployerContext={hasEmployerContext}
            chatReady={chatReady}
            minReplies={minReplies}
            assistantCount={assistantCount}
            quizAnswers={quizAnswers}
            roadmap={roadmap}
            isGenerating={roadmapLoading}
            onGenerate={() => handleGenerateRoadmap()}
            onUpdateAnswers={handleUpdateAnswers}
            onRegenerateWithNewContext={handleRegenerateWithNewContext}
          />
        )}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => sendMessage()}
          disabled={loading}
        />
      </div>

      {/* ── Side panel: persisted task helper + collapse ───────────────────── */}
      {panelExpanded ? (
        <TaskPanel
          key={taskPanelKey}
          task={activeTask}
          helpMode={helpMode}
          messages={messages}
          onMarkDone={() => {}}
          roadmap={
            roadmap
              ? { userTasks: roadmap.userTasks, employerTasks: roadmap.employerTasks }
              : null
          }
          onSelectRoadmapTask={(t) => {
            if (!roadmap) {
              setTaskFromRoadmap(t, "user");
              return;
            }
            const section = roadmap.userTasks.some((x) => x.id === t.id)
              ? "user"
              : "employer";
            setTaskFromRoadmap(t, section);
          }}
          onSelectGeneral={setGeneralHelp}
          onCollapsePanel={() => setPanelExpanded(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setPanelExpanded(true)}
          className="w-10 shrink-0 border-l border-gray-100 bg-white hover:bg-gray-50 flex flex-col items-center justify-center gap-2 py-6 text-gray-500 transition-colors"
          title="Show help panel"
          aria-label="Show help panel"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span
            className="text-[10px] font-medium text-gray-600 leading-tight"
            style={{ writingMode: "vertical-rl" }}
          >
            Steps
          </span>
        </button>
      )}

      <ConsultantDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        messages={messages}
      />
    </div>
  );
}
