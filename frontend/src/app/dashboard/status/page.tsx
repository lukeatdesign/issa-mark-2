"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPinIcon } from "@heroicons/react/24/outline";

type StageStatus = "completed" | "active" | "upcoming";

interface Stage {
  id: number;
  label: string;
  description: string;
  date: string;
  status: StageStatus;
}

const STAGES: Stage[] = [
  {
    id: 1,
    label: "Documents verified",
    description: "Issa reviewed and approved your documents",
    date: "Completed Apr 8, 2026",
    status: "completed",
  },
  {
    id: 2,
    label: "Employer approval received",
    description: "Ministry of Labour approved your employer",
    date: "Completed Apr 10, 2026",
    status: "completed",
  },
  {
    id: 3,
    label: "Visa application submitted",
    description: "Your Non-B application is at the Thai Embassy in Phnom Penh",
    date: "Submitted Apr 12, 2026 · Est. 5–7 working days",
    status: "active",
  },
  {
    id: 4,
    label: "Visa approved",
    description: "Thai Embassy approves your Non-B visa",
    date: "Estimated Apr 21, 2026",
    status: "upcoming",
  },
  {
    id: 5,
    label: "Ready to travel",
    description: "Collect passport and fly to Bangkok",
    date: "Estimated Apr 23, 2026",
    status: "upcoming",
  },
];

const SPARKLE_CONFIGS = [
  { style: { top: "-10px", left: "50%", transform: "translateX(-50%)" }, delay: "0ms" },
  { style: { top: "-3px", right: "-10px" },                              delay: "50ms" },
  { style: { bottom: "-3px", right: "-10px" },                           delay: "110ms" },
  { style: { bottom: "-10px", left: "50%", transform: "translateX(-50%)" }, delay: "70ms" },
  { style: { bottom: "-3px", left: "-10px" },                            delay: "30ms" },
  { style: { top: "-3px", left: "-10px" },                               delay: "90ms" },
];

function StageIcon({ status, celebrating }: { status: StageStatus; celebrating?: boolean }) {
  if (status === "completed") {
    return (
      <div className="relative shrink-0 w-7 h-7">
        <div
          className={`w-7 h-7 rounded-full bg-green-500 flex items-center justify-center ${
            celebrating ? "animate-celebrate-pop" : ""
          }`}
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {celebrating &&
          SPARKLE_CONFIGS.map((cfg, k) => (
            <span
              key={k}
              className="absolute w-1.5 h-1.5 rounded-full bg-green-400 animate-sparkle-fade pointer-events-none"
              style={{ ...cfg.style, animationDelay: cfg.delay }}
            />
          ))}
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full border-2 border-gray-200 bg-white shrink-0" />
  );
}


type StatusEmptyReason = "no_roadmap" | "no_task_done";

const STATUS_DEMO_STORAGE_KEY = "issa_status_demo";
const CELEBRATE_KEY = "issa_status_celebrate";

const DEFAULT_DEMO_STAGE = 2;

export default function StatusPage() {
  const router = useRouter();
  const [demoStage, setDemoStage] = useState(DEFAULT_DEMO_STAGE);
  const [reachedApproved, setReachedApproved] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [emptyReason, setEmptyReason] = useState<StatusEmptyReason | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [celebrateIdx, setCelebrateIdx] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("issa_roadmap");
    if (!raw) {
      setEmptyReason("no_roadmap");
      setIsReady(true);
      return;
    }
    try {
      const roadmap = JSON.parse(raw);
      setUserName(roadmap?.userName ?? null);
      const hasDone = roadmap?.userTasks?.some((t: { done: boolean }) => t.done);
      if (!hasDone) {
        setEmptyReason("no_task_done");
      } else {
        setEmptyReason(null);
        try {
          const saved = localStorage.getItem(STATUS_DEMO_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as {
              demoStage?: number;
              reachedApproved?: boolean;
            };
            if (typeof parsed.demoStage === "number" && !Number.isNaN(parsed.demoStage)) {
              const max = STAGES.length - 1;
              setDemoStage(Math.min(Math.max(parsed.demoStage, 0), max));
            }
            if (parsed.reachedApproved) setReachedApproved(true);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      setEmptyReason("no_roadmap");
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || emptyReason !== null) return;
    try {
      localStorage.setItem(
        STATUS_DEMO_STORAGE_KEY,
        JSON.stringify({ demoStage, reachedApproved })
      );
    } catch {
      // ignore
    }
  }, [demoStage, reachedApproved, isReady, emptyReason]);

  // One-more-visit replay: fire celebration when navigating back to this page
  useEffect(() => {
    if (!isReady || emptyReason !== null) return;
    try {
      const raw = localStorage.getItem(CELEBRATE_KEY);
      if (!raw) return;
      const idx = JSON.parse(raw) as number;
      localStorage.removeItem(CELEBRATE_KEY); // consume immediately — only plays once more
      const t1 = setTimeout(() => {
        setCelebrateIdx(idx);
        const t2 = setTimeout(() => setCelebrateIdx(null), 2000);
        return () => clearTimeout(t2);
      }, 500);
      return () => clearTimeout(t1);
    } catch {
      // ignore
    }
  }, [isReady, emptyReason]);

  const handleAdvanceStage = () => {
    const completedIdx = demoStage; // this stage is about to become "completed"
    setDemoStage((prev) => prev + 1);
    setCelebrateIdx(completedIdx);
    // Save so it replays once on next visit
    try {
      localStorage.setItem(CELEBRATE_KEY, JSON.stringify(completedIdx));
    } catch {
      // ignore
    }
    setTimeout(() => setCelebrateIdx(null), 2000);
  };

  const showDemoReset = reachedApproved || demoStage >= STAGES.length - 1;

  const handleResetStatusDemo = () => {
    setDemoStage(DEFAULT_DEMO_STAGE);
    setReachedApproved(false);
    try {
      localStorage.setItem(
        STATUS_DEMO_STORAGE_KEY,
        JSON.stringify({
          demoStage: DEFAULT_DEMO_STAGE,
          reachedApproved: false,
        })
      );
    } catch {
      // ignore
    }
  };

  const stages = STAGES.map((s, i) => ({
    ...s,
    status: (i < demoStage ? "completed" : i === demoStage ? "active" : "upcoming") as StageStatus,
  }));

  if (!isReady) return <div className="flex-1" />;

  if (emptyReason === "no_roadmap") {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <MapPinIcon className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">Status</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          This page becomes your application timeline: milestones like document verification,
          employer approval, and visa processing, with dates and what happens next. It opens up
          once you have a roadmap and start moving tasks forward.
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            What you&apos;ll see after you&apos;re underway
          </p>
          <ul className="text-sm text-gray-600 space-y-2.5 list-disc list-inside marker:text-blue-500">
            <li>
              <span className="-ml-1">Completed and active stages at a glance</span>
            </li>
            <li>
              <span className="-ml-1">Short descriptions of each step (embassy, employer, etc.)</span>
            </li>
            <li>
              <span className="-ml-1">Encouragement and rough timing where Issa has updates</span>
            </li>
          </ul>
        </div>
        <Link
          href="/dashboard/chat"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Start in Chat to get your roadmap →
        </Link>
      </main>
    );
  }

  if (emptyReason === "no_task_done") {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <MapPinIcon className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">Status</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          You already have a roadmap, but the live timeline hasn&apos;t started yet. This view
          fills in once you complete real progress—for example, after you work through{" "}
          <strong className="font-medium text-gray-800">Documents</strong> and hand off to Issa, or
          when steps on your roadmap are checked off.
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Typical next steps
          </p>
          <ul className="text-sm text-gray-600 space-y-2.5 list-disc list-inside marker:text-blue-500">
            <li>
              <span className="-ml-1">Gather files on Documents and mark them ready</span>
            </li>
            <li>
              <span className="-ml-1">Send your pack to Issa when prompted</span>
            </li>
            <li>
              <span className="-ml-1">Come back here for embassy and employer milestones</span>
            </li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/documents"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Open Documents →
          </Link>
          <Link
            href="/dashboard/roadmap"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            My Roadmap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      {/* Back + optional reset (when demo reached final / success) */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/dashboard/roadmap"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to roadmap
        </Link>
        {showDemoReset ? (
          <button
            type="button"
            onClick={handleResetStatusDemo}
            className="text-xs font-normal text-gray-400 hover:text-gray-600 transition-colors"
          >
            Reset demo
          </button>
        ) : (
          <span className="w-px" aria-hidden />
        )}
      </div>

      {/* Header */}
      <h1 className="text-xl font-display font-semibold text-gray-900 mb-1">
        Your application status
      </h1>
      <p className="text-sm text-gray-500 mb-4">Updated in real time by Issa&apos;s team</p>

      {/* Teal banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800 mb-8">
        You&apos;re on track, {userName ?? "there"}! Sit tight — the embassy typically takes 5–7 working days.
      </div>

      {/* Stepper */}
      <div>
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          const nextStatus = stages[i + 1]?.status;
          const lineGreen = stage.status === "completed" && nextStatus === "completed";
          return (
            <div
              key={stage.id}
              className="flex gap-4 animate-fade-in-up opacity-0 [animation-fill-mode:both]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Icon column — line runs straight through here */}
              <div className="flex flex-col items-center">
                <StageIcon status={stage.status} celebrating={celebrateIdx === i} />
                {!isLast && (
                  lineGreen
                    ? <div className="w-0.5 flex-1 min-h-8 my-1 bg-green-300" />
                    : <div className="flex-1 min-h-8 my-1 border-l-2 border-dashed border-gray-200" />
                )}
              </div>
              {/* Content */}
              <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                <p
                  className={`text-sm font-semibold leading-snug ${
                    stage.status === "upcoming" ? "text-gray-400" : "text-gray-800"
                  } ${celebrateIdx === i ? "animate-text-brighten" : ""}`}
                  style={celebrateIdx === i ? { animationDelay: "0.55s" } : undefined}
                >
                  {stage.label}
                </p>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    stage.status === "upcoming" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {stage.description}
                </p>
                <p
                  className={`text-xs mt-0.5 font-medium ${
                    stage.status === "active"
                      ? "text-blue-600"
                      : stage.status === "completed"
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {stage.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo button — always visible, changes label at final stage */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-3 text-center">
          Demo: simulate an update from Issa&apos;s team
        </p>
        {demoStage < STAGES.length - 1 ? (
          <button
            type="button"
            onClick={handleAdvanceStage}
            className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 text-sm font-medium rounded-xl transition-all"
          >
            Advance to next stage →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setReachedApproved(true);
              try {
                localStorage.setItem(
                  STATUS_DEMO_STORAGE_KEY,
                  JSON.stringify({
                    demoStage: STAGES.length - 1,
                    reachedApproved: true,
                  })
                );
              } catch {
                // ignore
              }
              router.push("/dashboard/approved");
            }}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Visa approved! See the moment →
          </button>
        )}
      </div>
    </div>
  );
}
