"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MapIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { RoadmapData, RoadmapTask } from "@/lib/api";

interface OverviewCache {
  summary: string;
  tasksDone: number;
  docsUploaded: number;
}

// ── STATE A ───────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-32 px-6">
      <MapIcon className="w-10 h-10 text-gray-300 mx-auto mb-4" />
      <h1 className="text-xl font-semibold text-gray-700">
        Your journey starts here
      </h1>
      <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
        Chat with Compass to get your personalised visa roadmap.
      </p>
      <Link
        href="/dashboard/chat"
        className="border border-teal-600 text-teal-600 rounded-full px-5 py-2 text-sm mt-5 inline-block hover:bg-teal-50 transition-colors"
      >
        Start chatting →
      </Link>
    </div>
  );
}

// ── SECTION 1: AI Summary ─────────────────────────────────────────────────────
function SummaryCard({
  roadmap,
  tasksDone,
  docsUploaded,
}: {
  roadmap: RoadmapData;
  tasksDone: number;
  docsUploaded: number;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("issa_overview_cache");
      if (raw) {
        const cache: OverviewCache = JSON.parse(raw);
        if (cache.tasksDone === tasksDone && cache.docsUploaded === docsUploaded) {
          setSummary(cache.summary);
          setLoading(false);
          return;
        }
      }
    } catch { /* corrupted — fetch fresh */ }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/generate-overview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmap }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        const text: string = data.summary ?? "";
        if (!text) throw new Error("Empty summary in response");
        setSummary(text);
        try {
          localStorage.setItem(
            "issa_overview_cache",
            JSON.stringify({ summary: text, tasksDone, docsUploaded })
          );
        } catch { /* storage full — ignore */ }
      })
      .catch((err) => {
        console.error("[generate-overview] failed:", err);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [roadmap, tasksDone, docsUploaded]);

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">
        Current Progress
      </p>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="bg-emerald-100 rounded h-3 w-full" />
          <div className="bg-emerald-100 rounded h-3 w-full" />
          <div className="bg-emerald-100 rounded h-3 w-2/3" />
        </div>
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed">
          {summary ?? "We couldn't load your summary right now. Check back soon."}
        </p>
      )}
    </div>
  );
}

// ── SECTION 2: Next actions ───────────────────────────────────────────────────
const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-400",
  high: "bg-amber-400",
  normal: "bg-gray-300",
};

const PRIORITY_RING: Record<string, string> = {
  urgent: "group-hover:ring-red-200",
  high: "group-hover:ring-amber-200",
  normal: "group-hover:ring-gray-200",
};

function taskHref(task: RoadmapTask): string {
  const lower = task.task.toLowerCase();
  if (lower.includes("gather") && lower.includes("document")) return "/dashboard/documents";
  if (lower.includes("document")) return "/dashboard/documents";
  return "/dashboard/roadmap";
}

function NextActions({
  nextTasks,
  totalAvailable,
}: {
  nextTasks: RoadmapTask[];
  totalAvailable: number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        What to do next
      </p>
      {nextTasks.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          You&apos;re all caught up — check your roadmap for what&apos;s coming next.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {nextTasks.map((task) => (
              <Link
                key={task.id}
                href={taskHref(task)}
                className={`
                  group flex items-center justify-between gap-3
                  bg-white rounded-xl border border-gray-100 shadow-sm p-4
                  hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5
                  hover:bg-emerald-50/30 active:translate-y-0 active:shadow-sm
                  transition-all duration-200 cursor-pointer ring-0
                  ${PRIORITY_RING[task.priority] ?? "group-hover:ring-gray-200"}
                `}
              >
                {/* Left: dot + task name + conditional pills */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`
                      w-2 h-2 rounded-full flex-shrink-0
                      ${PRIORITY_DOT[task.priority] ?? "bg-gray-300"}
                      ${task.priority === "urgent" ? "animate-pulse" : ""}
                    `}
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors truncate">
                      {task.task}
                    </p>
                    {task.priority === "urgent" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0">
                        Urgent
                      </span>
                    )}
                    {task.canAutomate && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 flex-shrink-0">
                        Issa can help
                      </span>
                    )}
                  </div>
                </div>
                {/* Right: status badge + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.status === "in_progress" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      In progress
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      Ready to start
                    </span>
                  )}
                  <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
          {totalAvailable > nextTasks.length && (
            <Link
              href="/dashboard/roadmap"
              className="mt-3 text-xs text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              +{totalAvailable - nextTasks.length} more actions on your roadmap
              <ChevronRightIcon className="w-3 h-3" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}

// ── SECTION 3A: Documents mini card ──────────────────────────────────────────
const DOC_IDS = [1, 2, 3, 4];
const DOC_NAMES: Record<number, string> = {
  1: "Passport copy",
  2: "Passport photo",
  3: "Degree certificate",
  4: "Certified translation",
};

function DocumentsCard({ docReady }: { docReady: Record<number, boolean> }) {
  const readyCount = DOC_IDS.filter((id) => docReady[id]).length;
  const allReady = readyCount === DOC_IDS.length;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        Documents
      </p>
      <p className="text-sm font-semibold text-gray-800 mb-3">
        {readyCount} of {DOC_IDS.length} ready
      </p>
      <div className="space-y-2 flex-1">
        {DOC_IDS.map((id) => {
          const checked = !!docReady[id];
          return (
            <div key={id} className="flex items-center gap-2.5">
              <div
                className={`
                  w-4 h-4 rounded flex items-center justify-center flex-shrink-0
                  pointer-events-none select-none border
                  ${checked ? "bg-teal-500 border-teal-500" : "bg-white border-gray-300"}
                `}
              >
                {checked && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`text-xs truncate ${checked ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                {DOC_NAMES[id]}
              </span>
            </div>
          );
        })}
      </div>
      <Link
        href="/dashboard/documents"
        className="mt-4 w-full text-center text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg py-2 transition-colors"
      >
        {allReady ? "All documents ready ✓" : "Upload documents →"}
      </Link>
    </div>
  );
}

// ── SECTION 3B: Status mini card ──────────────────────────────────────────────
function deriveStage(tasksDone: number): string {
  if (tasksDone === 0) return "Getting started";
  if (tasksDone === 1) return "Documents phase";
  if (tasksDone === 2) return "Visa application";
  return "Almost there";
}

function StatusCard({
  roadmap,
  tasksDone,
}: {
  roadmap: RoadmapData;
  tasksDone: number;
}) {
  const stage = deriveStage(tasksDone);
  const totalTasks = (roadmap.userTasks ?? []).length;
  const nextUrgent = (roadmap.userTasks ?? []).find(
    (t) => !t.done && t.priority === "urgent" && t.status !== "blocked"
  );

  // Cap dot display at 8; show remainder as count
  const MAX_DOTS = 8;
  const displayDots = Math.min(totalTasks, MAX_DOTS);
  const overflow = totalTasks - MAX_DOTS;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        Application status
      </p>

      <div className="flex-1 flex flex-col gap-3">
        {/* Discrete task stepper — full width, first */}
        {totalTasks > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1.5">
              Tasks — <span className="text-gray-700 font-medium">{tasksDone} of {totalTasks} done</span>
            </p>
            <div className="flex items-center gap-1 w-full">
              {Array.from({ length: displayDots }).map((_, i) => {
                const done = i < tasksDone;
                const current = i === tasksDone;
                return (
                  <div
                    key={i}
                    className={`
                      flex-1 h-5 rounded-full flex items-center justify-center transition-colors
                      ${done ? "bg-blue-500" : current ? "bg-blue-100 ring-1 ring-blue-300" : "bg-gray-100"}
                    `}
                  >
                    {done && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {current && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    )}
                  </div>
                );
              })}
              {overflow > 0 && (
                <span className="text-xs text-gray-400 ml-1 flex-shrink-0">+{overflow}</span>
              )}
            </div>
          </div>
        )}

        {/* Two-per-row metadata grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Phase</p>
            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {stage}
            </span>
          </div>
          {roadmap.visaType && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Visa type</p>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {roadmap.visaType}
              </span>
            </div>
          )}
          {roadmap.timeline && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Timeline</p>
              <p className="text-xs font-medium text-gray-700">{roadmap.timeline}</p>
            </div>
          )}
          {nextUrgent && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Next up</p>
              <p className="text-xs font-medium text-gray-700 leading-snug line-clamp-2">{nextUrgent.task}</p>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/dashboard/status"
        className="mt-4 w-full text-center text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg py-2 transition-colors"
      >
        View full status
      </Link>
    </div>
  );
}

// ── GREETING ─────────────────────────────────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function positiveSubtitle(tasksDone: number, total: number): string {
  if (total === 0) return "Your visa journey starts here — let's get moving.";
  if (tasksDone === 0) return "Everything is set up and ready for you to begin.";
  if (tasksDone >= total) return "Outstanding work — you've completed everything on your list.";
  const pct = Math.round((tasksDone / total) * 100);
  if (pct >= 75) return "You're in the home stretch — almost there!";
  if (pct >= 50) return "You're more than halfway there. Keep the momentum going.";
  return "You're making solid progress — every step counts.";
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [docReady, setDocReady] = useState<Record<number, boolean>>({});
  const [quizName, setQuizName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("issa_roadmap");
      if (raw) setRoadmap(JSON.parse(raw));
    } catch { /* corrupted — treat as empty */ }

    try {
      const raw = localStorage.getItem("issa_onboarding");
      if (raw) {
        const parsed = JSON.parse(raw);
        const name = parsed?.state?.answers?.name;
        if (name) setQuizName(name);
      }
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem("issa_documents_checklist");
      if (raw) {
        const parsed = JSON.parse(raw) as { ready?: Record<string, boolean> };
        if (parsed.ready) {
          const next: Record<number, boolean> = {};
          for (const [k, v] of Object.entries(parsed.ready)) {
            if (v) next[Number(k)] = true;
          }
          setDocReady(next);
        }
      }
    } catch { /* corrupted — ignore */ }

    setReady(true);
  }, []);

  if (!ready) return <div className="flex-1" />;
  if (!roadmap) return <EmptyState />;

  const userTasks: RoadmapTask[] = roadmap.userTasks ?? [];
  const tasksDone = userTasks.filter((t) => t.done).length;
  const totalTasks = userTasks.length;
  const availableTasks = userTasks.filter(
    (t) => !t.done && (t.status === "available" || t.status === "in_progress")
  );
  const nextTasks = availableTasks.slice(0, 5);
  const userName = roadmap.userName || quizName || "there";
  const docsUploaded = DOC_IDS.filter((id) => docReady[id]).length;

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 flex flex-col gap-6">

      {/* Greeting header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {greeting()}, {userName} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {positiveSubtitle(tasksDone, totalTasks)}
        </p>
      </div>

      <SummaryCard
        roadmap={roadmap}
        tasksDone={tasksDone}
        docsUploaded={docsUploaded}
      />
      <NextActions nextTasks={nextTasks} totalAvailable={availableTasks.length} />
      <div className="grid grid-cols-2 gap-4">
        <DocumentsCard docReady={docReady} />
        <StatusCard roadmap={roadmap} tasksDone={tasksDone} />
      </div>
    </div>
  );
}
