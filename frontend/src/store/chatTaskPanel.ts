import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatActiveTask } from "@/types";
import type { RoadmapTask } from "@/lib/api";

export type ChatHelpMode = "task" | "general";

export function roadmapTaskToActive(
  t: RoadmapTask,
  taskSection: "user" | "employer"
): ChatActiveTask {
  return {
    roadmapTaskId: t.id,
    taskSection,
    task: t.task,
    detail: t.detail,
    subtasks: t.subtasks ?? [],
    status: t.status,
    blockedBy: t.blockedBy ?? null,
    canAutomate: t.canAutomate,
    automationHint: t.automationHint ?? null,
    priority: t.priority,
  };
}

interface ChatTaskPanelState {
  panelExpanded: boolean;
  helpMode: ChatHelpMode;
  activeTask: ChatActiveTask | null;
  setPanelExpanded: (v: boolean) => void;
  togglePanelExpanded: () => void;
  setTaskFromRoadmap: (t: RoadmapTask, taskSection: "user" | "employer") => void;
  setTaskPayload: (t: ChatActiveTask) => void;
  setGeneralHelp: () => void;
}

export const useChatTaskPanelStore = create<ChatTaskPanelState>()(
  persist(
    (set) => ({
      panelExpanded: true,
      helpMode: "general",
      activeTask: null,

      setPanelExpanded: (v) => set({ panelExpanded: v }),

      togglePanelExpanded: () => set((s) => ({ panelExpanded: !s.panelExpanded })),

      setTaskFromRoadmap: (t, taskSection) =>
        set({
          activeTask: roadmapTaskToActive(t, taskSection),
          helpMode: "task",
          panelExpanded: true,
        }),

      setTaskPayload: (t) =>
        set({
          activeTask: t,
          helpMode: "task",
          panelExpanded: true,
        }),

      setGeneralHelp: () =>
        set({
          activeTask: null,
          helpMode: "general",
        }),
    }),
    { name: "wayfarer_chat_task_panel" }
  )
);
