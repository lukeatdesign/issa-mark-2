import type { ChatMessage, ChatActiveTask } from "@/types";
import type { RoadmapData } from "@/lib/api";
import { resolveSubtaskProgressKey } from "@/lib/subtaskProgress";

/** Stable thread id for chat + subtask progress (same as dashboard `resolvedThreadId`). */
export function resolveTaskChatThreadId(
  task: ChatActiveTask,
  roadmap: Pick<RoadmapData, "userTasks" | "employerTasks"> | null
): string {
  return resolveSubtaskProgressKey(
    roadmap,
    task.roadmapTaskId,
    task.task,
    task.taskSection
  );
}

/** Read roadmap from localStorage for thread key resolution before React roadmap state loads. */
export function readRoadmapFromStorage(): Pick<
  RoadmapData,
  "userTasks" | "employerTasks"
> | null {
  try {
    const raw = localStorage.getItem("issa_roadmap");
    if (!raw) return null;
    const data = JSON.parse(raw) as RoadmapData;
    if (!data?.userTasks || !data?.employerTasks) return null;
    return {
      userTasks: data.userTasks,
      employerTasks: data.employerTasks,
    };
  } catch {
    return null;
  }
}

export function buildTaskIntroContent(t: ChatActiveTask): string {
  const subtaskList = (t.subtasks ?? [])
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  let body: string;
  if (t.status === "blocked") {
    body =
      `You want to work on **${t.task}** — great that you're thinking ahead!\n\n` +
      `Just so you know, this step is waiting on: **${t.blockedBy ?? "another step"}**.\n\n` +
      `While you wait, here's what you can prepare in advance:\n${subtaskList}\n\n` +
      `Is there anything I can help you understand about this step?`;
  } else {
    body =
      `Let's work on **${t.task}** together. ${t.detail}\n\n` +
      `Here's what you need to do:\n${subtaskList}\n\n` +
      `Where would you like to start, or do you have any questions about any of these steps?`;
  }

  if (t.canAutomate && t.automationHint) {
    body += `\n\n💡 ${t.automationHint}`;
  }

  return body;
}

export function createTaskIntroMessage(task: ChatActiveTask): ChatMessage {
  return {
    id: `task-intro-${Date.now()}`,
    conversation_id: "",
    role: "assistant",
    content: buildTaskIntroContent(task),
    feedback: null,
    created_at: new Date().toISOString(),
  };
}
