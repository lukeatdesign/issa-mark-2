"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import type { RoadmapData, RoadmapTask } from "@/lib/api";
import {
  subtaskStorageKey,
  readSubtaskProgress,
  clampSubtaskProgress,
  writeSubtaskChecked,
} from "@/lib/subtaskProgress";
import { persistRoadmapTaskCompletion } from "@/lib/roadmapPersist";

const isDocsTaskName = (name: unknown) => {
  const lower = String(name ?? "").toLowerCase();
  return lower.includes("gather") && lower.includes("document");
};

/** Prefer a primary Upload CTA instead of the teal automation hint (e.g. passport checks, “upload in app”). */
function shouldOfferUploadDocumentsCTA(task: RoadmapTask): boolean {
  const title = String(task.task ?? "").toLowerCase();
  if (title.includes("passport") && /\b(valid|validity|verify|check|expir)\b/.test(title)) return true;

  if (!task.canAutomate || !task.automationHint?.trim()) return false;
  const hint = String(task.automationHint).toLowerCase();
  if (/upload|document|passport|file|in app|issa app/.test(hint)) return true;
  return false;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RoadmapTask["status"] }) {
  if (status === "available")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Ready to start
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        In progress
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      Not yet
    </span>
  );
}

function PriorityPill({ priority }: { priority: RoadmapTask["priority"] }) {
  if (priority === "urgent")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
        Urgent
      </span>
    );
  if (priority === "high")
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
        This week
      </span>
    );
  return null;
}

// ── inline confirmation ───────────────────────────────────────────────────────

function ConfirmInline({
  isDocsTask,
  onConfirm,
  onDismiss,
}: {
  isDocsTask: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const router = useRouter();

  if (isDocsTask) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 text-sm">
        <p className="text-amber-900 font-medium mb-2">Do you have all your documents ready?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Yes, mark as complete
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents")}
            className="px-3 py-1.5 border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium rounded-lg transition-colors"
          >
            I&apos;d like to upload them
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 text-sm">
      <p className="text-amber-900 font-medium mb-2">Mark this task as complete?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Yes, done!
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-medium rounded-lg transition-colors"
        >
          Not yet
        </button>
      </div>
    </div>
  );
}

// ── expandable task card ──────────────────────────────────────────────────────

function TaskCard({
  task,
  taskSection,
  checked,
  onToggle,
  onHelpClick,
}: {
  task: RoadmapTask;
  taskSection: "user" | "employer";
  checked: boolean;
  onToggle: () => void;
  onHelpClick: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const subtaskStorageKeyMemo = useMemo(
    () => subtaskStorageKey(taskSection, task.id),
    [taskSection, task.id]
  );
  const [subtaskChecked, setSubtaskChecked] = useState<Record<number, boolean>>(() =>
    clampSubtaskProgress(
      readSubtaskProgress(subtaskStorageKey(taskSection, task.id)),
      task.subtasks?.length ?? 0
    )
  );
  const [confirming, setConfirming] = useState(false);

  const subtasksLen = task.subtasks?.length ?? 0;
  const subtasksKey = useMemo(() => (task.subtasks ?? []).join("|"), [task.subtasks]);

  useEffect(() => {
    const n = subtasksLen;
    setSubtaskChecked(
      clampSubtaskProgress(readSubtaskProgress(subtaskStorageKeyMemo), n)
    );
  }, [subtaskStorageKeyMemo, subtasksLen, subtasksKey]);

  const toggleSubtask = (i: number) => {
    const n = task.subtasks?.length ?? 0;
    setSubtaskChecked((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      writeSubtaskChecked(subtaskStorageKeyMemo, i, !!next[i], n);
      return clampSubtaskProgress(next, n);
    });
  };

  const isUrgent = task.priority === "urgent" && task.status === "available";
  const isDocsTask = isDocsTaskName(task.task);
  const showUploadPrimary = isDocsTask || shouldOfferUploadDocumentsCTA(task);

  const handleCheckboxClick = () => {
    if (checked) {
      // Already done — allow direct uncheck without confirmation
      onToggle();
    } else {
      setConfirming(true);
    }
  };

  const handleConfirm = () => {
    setConfirming(false);
    onToggle();
  };

  const handleDismiss = () => {
    setConfirming(false);
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isUrgent
          ? "border-l-4 border-amber-500 border-t border-r border-b border-amber-200 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Main row */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
              checked
                ? "bg-brand-600 border-brand-600 animate-scale-pop"
                : "border-gray-300 hover:border-brand-400"
            }`}
          >
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {isDocsTask ? (
                <Link
                  href="/dashboard/documents"
                  className={`text-sm font-medium leading-snug underline decoration-dotted underline-offset-2 ${
                    checked ? "line-through text-gray-400" : "text-brand-700 hover:text-brand-900"
                  }`}
                >
                  {task.task}
                </Link>
              ) : (
                <p className={`text-sm font-medium leading-snug ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                  {task.task}
                </p>
              )}
              <PriorityPill priority={task.priority} />
            </div>

            {/* Status + detail */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <StatusBadge status={task.status} />
            </div>

            {task.detail && (
              <p className={`text-xs leading-relaxed ${checked ? "text-gray-300" : "text-gray-500"}`}>
                {task.detail}
              </p>
            )}

            {/* See details toggle */}
            {(task.subtasks?.length > 0 || task.canAutomate || task.status === "blocked") && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {expanded ? "Hide details ↑" : "See details ↓"}
              </button>
            )}
          </div>
        </div>

        {/* Inline confirmation */}
        {confirming && (
          <div className="animate-fade-in-up">
          <ConfirmInline
            isDocsTask={isDocsTask}
            onConfirm={handleConfirm}
            onDismiss={handleDismiss}
          />
          </div>
        )}

        {/* Expanded section */}
        {expanded && (
          <div className="mt-3 ml-8 space-y-2">
            {/* Subtasks */}
            {task.subtasks?.length > 0 && (
              <ol className="space-y-1.5">
                {task.subtasks.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSubtask(i)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        subtaskChecked[i]
                          ? "bg-brand-600 border-brand-600 animate-scale-pop"
                          : "border-gray-300 hover:border-brand-400"
                      }`}
                    >
                      {subtaskChecked[i] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-xs leading-relaxed ${subtaskChecked[i] ? "line-through text-gray-400" : "text-gray-600"}`}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {/* Automation hint — hidden when Upload documents is the primary action */}
            {task.canAutomate && task.automationHint && !shouldOfferUploadDocumentsCTA(task) && (
              <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-xs text-teal-800 font-medium">{task.automationHint}</p>
              </div>
            )}

            {/* Blocked note */}
            {task.status === "blocked" && task.blockedBy && (
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-500">Waiting for: <span className="font-medium text-gray-600">{task.blockedBy}</span></p>
              </div>
            )}

            {/* Action buttons row — Upload primary (left), Help secondary (right) */}
            <div className="flex flex-wrap gap-2 items-stretch sm:items-center">
              {showUploadPrimary && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/documents")}
                  className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-lg px-4 py-2 shadow-sm transition-all"
                >
                  Upload documents
                </button>
              )}
              <button
                type="button"
                onClick={onHelpClick}
                className="text-sm font-medium text-teal-800 bg-white border border-teal-300 rounded-lg px-4 py-2 hover:bg-teal-50 active:scale-95 transition-all"
              >
                {task.status === "blocked" ? "Understand this step →" : "Help me do this →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── task section ──────────────────────────────────────────────────────────────

function TaskSection({
  title,
  Icon,
  tasks,
  taskSection,
  checked,
  onToggle,
  onHelpClick,
}: {
  title: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tasks: RoadmapTask[];
  taskSection: "user" | "employer";
  checked: Record<number, boolean>;
  onToggle: (id: number) => void;
  onHelpClick: (task: RoadmapTask, section: "user" | "employer") => void;
}) {
  const doneCount = tasks.filter((t) => checked[t.id]).length;

  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
        <span className="text-xs text-gray-400 tabular-nums">{doneCount}/{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            taskSection={taskSection}
            checked={!!checked[task.id]}
            onToggle={() => onToggle(task.id)}
            onHelpClick={() => onHelpClick(task, taskSection)}
          />
        ))}
      </div>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

export default function RoadmapCard({ data }: { data: RoadmapData }) {
  const router = useRouter();
  const [userChecked, setUserChecked] = useState<Record<number, boolean>>(() => {
    // Pre-populate from localStorage — docs page may have auto-completed a task
    const stored = data.userTasks.reduce((acc, t) => {
      if (t.done) acc[t.id] = true;
      return acc;
    }, {} as Record<number, boolean>);
    return stored;
  });
  const [employerChecked, setEmployerChecked] = useState<Record<number, boolean>>(() => {
    return data.employerTasks.reduce((acc, t) => {
      if (t.done) acc[t.id] = true;
      return acc;
    }, {} as Record<number, boolean>);
  });

  useEffect(() => {
    persistRoadmapTaskCompletion(data, userChecked, employerChecked);
  }, [data, userChecked, employerChecked]);

  const toggleUser = (id: number) =>
    setUserChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleEmployer = (id: number) =>
    setEmployerChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleHelp = (task: RoadmapTask, taskSection: "user" | "employer") => {
    localStorage.setItem(
      "issa_active_task",
      JSON.stringify({
        roadmapTaskId: task.id,
        taskSection,
        task: task.task,
        detail: task.detail,
        subtasks: task.subtasks,
        status: task.status,
        blockedBy: task.blockedBy ?? null,
        canAutomate: task.canAutomate,
        automationHint: task.automationHint ?? null,
      })
    );
    router.push("/dashboard/chat");
  };

  const totalTasks = data.userTasks.length + data.employerTasks.length;
  const totalDone =
    Object.values(userChecked).filter(Boolean).length +
    Object.values(employerChecked).filter(Boolean).length;
  const pct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const allDone = totalDone === totalTasks && totalTasks > 0;

  const focusTasks = useMemo(() => {
    const priorityWeight: Record<NonNullable<RoadmapTask["priority"]> | "none", number> =
      { urgent: 0, high: 1, normal: 2, none: 3 };
    const statusWeight: Record<RoadmapTask["status"], number> = {
      available: 0,
      in_progress: 1,
      blocked: 2,
    };

    const candidates: Array<{ task: RoadmapTask; section: "user" | "employer" }> = [
      ...data.userTasks.map((t) => ({ task: t, section: "user" as const })),
      ...data.employerTasks.map((t) => ({ task: t, section: "employer" as const })),
    ];

    return candidates
      .filter(({ task, section }) => {
        const done = section === "user" ? !!userChecked[task.id] : !!employerChecked[task.id];
        if (done) return false;
        // Prefer tasks you can act on now
        if (task.status === "blocked") return false;
        return task.status === "available" || task.status === "in_progress";
      })
      .sort((a, b) => {
        const ap = priorityWeight[a.task.priority ?? "none"];
        const bp = priorityWeight[b.task.priority ?? "none"];
        if (ap !== bp) return ap - bp;
        const as = statusWeight[a.task.status];
        const bs = statusWeight[b.task.status];
        if (as !== bs) return as - bs;
        return a.task.id - b.task.id;
      })
      .slice(0, 3);
  }, [data.userTasks, data.employerTasks, userChecked, employerChecked]);

  return (
    <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden my-4">

      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/85 text-xs font-medium mb-0.5">
              {data.userName ? `${data.userName}'s personalised roadmap` : "Your personalised roadmap"}
            </p>
            <h2 className="text-white font-display font-semibold text-lg leading-tight drop-shadow-sm">
              {data.visaType}
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-white text-xs font-medium">{data.timeline}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/90 mb-1.5 font-medium">
            <span>{allDone ? "All done!" : `${totalDone} of ${totalTasks} tasks complete`}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Focus section */}
      {focusTasks.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-800">Start here</span>
            <span className="text-xs text-gray-400">— your most relevant next actions</span>
          </div>
          <div className="space-y-2">
            {focusTasks.map(({ task, section }, i) => (
              <div
                key={`focus-${task.id}`}
                className="animate-fade-in-up opacity-0 [animation-fill-mode:both]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <TaskCard
                  task={task}
                  taskSection={section}
                  checked={!!(section === "user" ? userChecked[task.id] : employerChecked[task.id])}
                  onToggle={() => (section === "user" ? toggleUser(task.id) : toggleEmployer(task.id))}
                  onHelpClick={() => handleHelp(task, section)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task columns */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TaskSection
          title="What you need to do"
          Icon={UserIcon}
          tasks={data.userTasks}
          taskSection="user"
          checked={userChecked}
          onToggle={toggleUser}
          onHelpClick={handleHelp}
        />
        <TaskSection
          title="What your employer does"
          Icon={BuildingOffice2Icon}
          tasks={data.employerTasks}
          taskSection="employer"
          checked={employerChecked}
          onToggle={toggleEmployer}
          onHelpClick={handleHelp}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Estimated completion · <span className="font-medium text-gray-500">{data.estimatedDays} days</span>
        </p>
        <p className="text-xs text-gray-300">Tap any task to mark it done</p>
      </div>
    </div>
  );
}
