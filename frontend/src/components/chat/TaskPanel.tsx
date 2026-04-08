"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ChatMessage, ChatActiveTask } from "@/types";
import type { RoadmapTask } from "@/lib/api";
import type { ChatHelpMode } from "@/store/chatTaskPanel";
import {
  resolveSubtaskProgressKey,
  readSubtaskProgress,
  clampSubtaskProgress,
  writeSubtaskChecked,
} from "@/lib/subtaskProgress";

/** @deprecated use ChatActiveTask from @/types */
export type ActiveTask = ChatActiveTask;

// Assistant text that sounds like the user has finished the overall task
const AI_DONE_PATTERN =
  /\b(you('ve| have) (completed|finished|done it|got it done)|you('re| are) (all set|done|finished|good to go)|that('s| is) (done|complete|finished|sorted)|well done|great job|nicely done|task (is )?complete|successfully (completed|submitted|uploaded|sent|provided))\b/i;

// User text that often means a subtask moved forward (first-person, third-party, or passive)
const USER_STEP_DONE_HINT =
  /\b(i'?ve|i have|i already|i just|finished|completed|submitted|uploaded|sent|filed|mailed|received|got my|done with|taken care of|took care of|picked up|collected|signed|booked|confirm(?:ed|s)?|confirmation|approved|paid|payment|paying|processed|cleared|settled|(?:they|we|embassy|consulate|office|vo)\s+(?:have\s+)?(?:confirm(?:ed|s)?|approved|accepted|received|processed)|(?:was|were)\s+(?:confirm(?:ed)?|approved|paid|received|processed)|(?:fee|fees)\s+(?:is|are|was|were)?\s*(?:paid|confirm(?:ed)?|settled|cleared))\b/i;

const NEGATION_NEAR =
  /\b(not|no|never|n't|haven't|hasn't|didn't|still need|haven't yet|not yet)\b/i;

const SUBTASK_STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "this", "that", "with", "from", "have", "been",
  "will", "must", "need", "what", "when", "they", "them", "then", "than", "into", "also",
  "each", "such", "only", "same", "most", "some", "time", "work", "take", "come", "back",
  "well", "step", "sure", "once", "after", "before", "here", "there",
]);

function keywordsFromSubtask(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[\u2014\u2013]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !SUBTASK_STOPWORDS.has(w));
}

function userTextContainsKeyword(lower: string, keyword: string): number {
  const variants = [keyword];
  if (keyword.endsWith("s") && keyword.length > 3) variants.push(keyword.slice(0, -1));
  else if (keyword.length >= 3) variants.push(`${keyword}s`);
  for (const v of variants) {
    const idx = lower.indexOf(v);
    if (idx !== -1) return idx;
  }
  return -1;
}

function userTextSuggestsSubtask(userBlob: string, subtask: string): boolean {
  const lower = userBlob.toLowerCase();
  const words = [...new Set(keywordsFromSubtask(subtask))];
  if (words.length === 0) return false;

  let matchingKeywords = 0;
  for (const w of words) {
    const idx = userTextContainsKeyword(lower, w);
    if (idx === -1) continue;
    const window = lower.slice(
      Math.max(0, idx - 40),
      Math.min(lower.length, idx + w.length + 40)
    );
    if (NEGATION_NEAR.test(window)) continue;
    matchingKeywords += 1;
  }

  if (matchingKeywords >= 2) return true;
  if (matchingKeywords >= 1 && USER_STEP_DONE_HINT.test(userBlob)) return true;
  return false;
}

function markTaskDoneByName(taskName: string) {
  try {
    const raw = localStorage.getItem("issa_roadmap");
    if (!raw) return;
    const data = JSON.parse(raw);
    let mutated = false;
    const markDone = (t: { task: string; done: boolean }) => {
      if (t.task === taskName && !t.done) {
        mutated = true;
        return { ...t, done: true };
      }
      return t;
    };
    data.userTasks = (data.userTasks ?? []).map(markDone);
    data.employerTasks = (data.employerTasks ?? []).map(markDone);
    if (mutated) localStorage.setItem("issa_roadmap", JSON.stringify(data));
  } catch { /* corrupted — ignore */ }
}

function isDocsTaskName(name: string) {
  const l = name.toLowerCase();
  return l.includes("gather") && l.includes("document");
}

function taskSelectValue(
  task: ChatActiveTask | null,
  helpMode: ChatHelpMode,
  roadmap: { userTasks: RoadmapTask[]; employerTasks: RoadmapTask[] } | null
): string {
  if (helpMode === "general" || !task) return "__general__";
  if (task.roadmapTaskId != null) return `t:${task.roadmapTaskId}`;
  if (!roadmap) return "__general__";
  const u = roadmap.userTasks.find((x) => x.task === task.task);
  if (u) return `t:${u.id}`;
  const e = roadmap.employerTasks.find((x) => x.task === task.task);
  if (e) return `t:${e.id}`;
  return "__general__";
}

export type TaskPanelRoadmapSlice = {
  userTasks: RoadmapTask[];
  employerTasks: RoadmapTask[];
};

interface Props {
  task: ChatActiveTask | null;
  helpMode: ChatHelpMode;
  messages: ChatMessage[];
  onMarkDone: () => void;
  roadmap: TaskPanelRoadmapSlice | null;
  onSelectRoadmapTask: (t: RoadmapTask) => void;
  onSelectGeneral: () => void;
  onCollapsePanel: () => void;
}

export default function TaskPanel({
  task,
  helpMode,
  messages,
  onMarkDone,
  roadmap,
  onSelectRoadmapTask,
  onSelectGeneral,
  onCollapsePanel,
}: Props) {
  const [subtaskChecked, setSubtaskChecked] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState<boolean>(() => {
    // Re-hydrate from localStorage so "Mark as done" survives navigation
    if (!task) return false;
    try {
      const raw = localStorage.getItem("issa_roadmap");
      if (!raw) return false;
      const data = JSON.parse(raw);
      const allTasks: Array<{ task: string; done: boolean }> = [
        ...(data.userTasks ?? []),
        ...(data.employerTasks ?? []),
      ];
      return allTasks.some((t) => t.task === task.task && !!t.done);
    } catch {
      return false;
    }
  });
  const [dismissedSuggest, setDismissedSuggest] = useState(false);
  const [subtaskDismissedSuggest, setSubtaskDismissedSuggest] = useState<
    Record<number, boolean>
  >({});

  const progressKey = useMemo(() => {
    if (!task) return null;
    return resolveSubtaskProgressKey(
      roadmap,
      task.roadmapTaskId,
      task.task,
      task.taskSection
    );
  }, [roadmap, task?.roadmapTaskId, task?.task, task?.taskSection]);

  useEffect(() => {
    if (!task || !progressKey) {
      setSubtaskChecked({});
      return;
    }
    const n = task.subtasks.length;
    setSubtaskChecked(clampSubtaskProgress(readSubtaskProgress(progressKey), n));
  }, [progressKey, task?.task, task?.subtasks.length, task?.subtasks.join("|")]);

  useEffect(() => {
    setSubtaskDismissedSuggest({});
  }, [progressKey]);

  const selectVal = taskSelectValue(task, helpMode, roadmap);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "__general__") {
      onSelectGeneral();
      return;
    }
    if (v.startsWith("t:") && roadmap) {
      const id = Number(v.slice(2));
      const picked =
        roadmap.userTasks.find((x) => x.id === id) ??
        roadmap.employerTasks.find((x) => x.id === id);
      if (picked) onSelectRoadmapTask(picked);
    }
  };

  const panelChrome = (
    <div className="px-3 py-2.5 border-b border-gray-100 bg-white flex-shrink-0 flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <label
          htmlFor="chat-task-select"
          className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide"
        >
          Help me with
        </label>
        <select
          id="chat-task-select"
          value={selectVal}
          onChange={handleSelectChange}
          className="mt-1 w-full text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="__general__">General immigration questions</option>
          {roadmap && roadmap.userTasks.length > 0 && (
            <optgroup label="Your tasks">
              {roadmap.userTasks.map((rt) => (
                <option key={rt.id} value={`t:${rt.id}`}>
                  {rt.task}
                </option>
              ))}
            </optgroup>
          )}
          {roadmap && roadmap.employerTasks.length > 0 && (
            <optgroup label="Employer / sponsor">
              {roadmap.employerTasks.map((rt) => (
                <option key={rt.id} value={`t:${rt.id}`}>
                  {rt.task}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
    </div>
  );

  const isDocsTask = task ? isDocsTaskName(task.task) : false;
  const allSubtasksDone =
    !!task &&
    task.subtasks.length > 0 &&
    task.subtasks.every((_, i) => subtaskChecked[i]);

  const recentAiText = messages
    .filter((m) => m.role === "assistant")
    .slice(-3)
    .map((m) => m.content)
    .join(" ");
  const aiSuggestsDone = AI_DONE_PATTERN.test(recentAiText) && !dismissedSuggest;

  const recentUserText = messages
    .filter((m) => m.role === "user")
    .slice(-6)
    .map((m) => m.content)
    .join("\n");
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  const showCompletionPrompt = !!task && (allSubtasksDone || aiSuggestsDone) && !done;

  const handleMarkDone = () => {
    if (!task) return;
    markTaskDoneByName(task.task);
    setDone(true);
    onMarkDone();
  };

  const toggleSubtask = (i: number) => {
    if (!task || !progressKey) return;
    const n = task.subtasks.length;
    setSubtaskChecked((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      writeSubtaskChecked(progressKey, i, !!next[i], n);
      return clampSubtaskProgress(next, n);
    });
  };

  if (task && done) {
    return (
      <div className="w-72 border-l border-gray-100 bg-white flex flex-col flex-shrink-0 h-full min-h-0 overflow-hidden">
        {panelChrome}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mb-4 animate-scale-pop">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Task completed!</p>
          <p className="text-xs text-gray-400 mb-6 leading-snug">
            &ldquo;{task.task}&rdquo; has been marked as done.
          </p>
          <Link
            href="/dashboard/roadmap"
            className="w-full text-center text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg py-2.5 transition-colors block"
          >
            Back to roadmap →
          </Link>
          <Link
            href="/dashboard"
            className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors block py-1"
          >
            Go to overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-100 bg-gray-50/40 flex flex-col flex-shrink-0 overflow-hidden h-full min-h-0">
      {panelChrome}

      {!task ? (
        <div className="flex-1 flex flex-col justify-center px-4 py-8 text-center text-xs text-gray-500 leading-relaxed">
          <p>
            No roadmap step is selected. Chat freely with Compass here, or pick a task above when
            you want structured step-by-step help.
          </p>
        </div>
      ) : (
        <>
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white flex-shrink-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
              Working on
            </p>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{task.task}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {task.status === "in_progress" ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">In progress</span>
              ) : task.status === "blocked" ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Blocked</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Ready to start</span>
              )}
              {task.priority === "urgent" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500">Urgent</span>
              )}
            </div>
            {task.status === "blocked" && task.blockedBy && (
              <p className="text-xs text-gray-400 mt-1.5">
                Waiting on: <span className="font-medium text-gray-600">{task.blockedBy}</span>
              </p>
            )}
          </div>

          {task.detail && (
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 leading-relaxed">{task.detail}</p>
            </div>
          )}

          {task.subtasks.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 flex-1 overflow-y-auto min-h-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">
                Steps
              </p>
              <div className="space-y-3">
                {task.subtasks.map((step, i) => {
                  const showSubtaskPrompt =
                    userMessageCount > 0 &&
                    !subtaskChecked[i] &&
                    !subtaskDismissedSuggest[i] &&
                    userTextSuggestsSubtask(recentUserText, step);

                  return (
                    <div key={i} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(i)}
                        className="flex items-start gap-2.5 w-full text-left group"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all active:scale-90 ${
                            subtaskChecked[i]
                              ? "bg-teal-500 border-teal-500 animate-scale-pop"
                              : "border-gray-300 group-hover:border-teal-400 bg-white"
                          }`}
                        >
                          {subtaskChecked[i] && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-xs leading-snug ${
                            subtaskChecked[i] ? "line-through text-gray-400" : "text-gray-700"
                          }`}
                        >
                          {step}
                        </span>
                      </button>
                      {showSubtaskPrompt ? (
                        <div className="ml-7 pl-0.5 rounded-lg border border-amber-100 bg-amber-50/90 px-2.5 py-2 animate-fade-in-up">
                          <p className="text-[11px] text-amber-900 leading-snug mb-1.5">
                            From what you shared, it sounds like you may have done this step. Mark it
                            complete?
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (task && progressKey) {
                                  writeSubtaskChecked(progressKey, i, true, task.subtasks.length);
                                }
                                setSubtaskChecked((prev) =>
                                  clampSubtaskProgress({ ...prev, [i]: true }, task?.subtasks.length ?? 0)
                                );
                              }}
                              className="flex-1 text-[11px] font-medium bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-md py-1 px-2 transition-all"
                            >
                              Yes, done
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setSubtaskDismissedSuggest((prev) => ({ ...prev, [i]: true }))
                              }
                              className="flex-1 text-[11px] text-amber-800/80 border border-amber-200/80 hover:bg-amber-100/60 rounded-md py-1 px-2 transition-colors"
                            >
                              Not yet
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {task.canAutomate && task.automationHint && (
            <div className="mx-4 mt-3 flex-shrink-0 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 flex items-start justify-between gap-3">
              <p className="text-xs text-violet-700 flex-1 min-w-0">💡 {task.automationHint}</p>
              {/\b(upload|document|passport|file|in app|issa app)\b/i.test(task.automationHint) && (
                <Link
                  href="/dashboard/documents"
                  className="text-xs font-semibold text-violet-800 hover:text-violet-950 underline underline-offset-2 shrink-0"
                >
                  Go
                </Link>
              )}
            </div>
          )}

          {showCompletionPrompt && (
            <div className="mx-4 mt-3 flex-shrink-0 bg-emerald-50 border border-emerald-200 rounded-xl p-3 animate-fade-in-up">
              <p className="text-xs font-medium text-emerald-800 mb-2">
                {aiSuggestsDone && !allSubtasksDone
                  ? "Compass thinks you may have finished this."
                  : "All steps checked — ready to complete?"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleMarkDone}
                  className="flex-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg py-1.5 transition-all"
                >
                  Mark as done ✓
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedSuggest(true)}
                  className="flex-1 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-lg py-1.5 transition-colors"
                >
                  Not yet
                </button>
              </div>
            </div>
          )}

          <div className="px-4 py-4 mt-auto flex-shrink-0 space-y-2">
            {isDocsTask && (
              <Link
                href="/dashboard/documents"
                className="block w-full text-center text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg py-2.5 transition-colors"
              >
                Upload documents →
              </Link>
            )}
            {!showCompletionPrompt && (
              <button
                type="button"
                onClick={handleMarkDone}
                className="w-full text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 active:scale-95 border border-teal-100 rounded-lg py-2.5 transition-all"
              >
                Mark as done ✓
              </button>
            )}
            <Link
              href="/dashboard/roadmap"
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              ← Back to roadmap
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
