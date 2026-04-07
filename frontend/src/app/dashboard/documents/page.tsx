"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface Doc {
  id: number;
  name: string;
  note: string;
  fakeFilename: string;
}

const DOCS: Doc[] = [
  {
    id: 1,
    name: "Passport copy",
    note: "Bio page, must show 6+ months validity",
    fakeFilename: "passport_bio.pdf",
  },
  {
    id: 2,
    name: "Passport photo",
    note: "4x6 cm, white background, recent",
    fakeFilename: "photo.jpg",
  },
  {
    id: 3,
    name: "Degree certificate",
    note: "Original or certified copy",
    fakeFilename: "degree_certificate.pdf",
  },
  {
    id: 4,
    name: "Certified translation",
    note: "If degree is not in English or Thai",
    fakeFilename: "degree_translation.pdf",
  },
];

const DOCS_STORAGE_KEY = "issa_documents_checklist";

function markDocsTaskDoneInLocalStorage() {
  try {
    const raw = localStorage.getItem("issa_roadmap");
    if (!raw) return;
    const data = JSON.parse(raw);
    let mutated = false;

    const markDone = (tasks: Array<{ task: string; done: boolean }>) =>
      tasks.map((t) => {
        const lower = t.task.toLowerCase();
        if (lower.includes("gather") && lower.includes("document") && !t.done) {
          mutated = true;
          return { ...t, done: true };
        }
        return t;
      });

    data.userTasks = markDone(data.userTasks ?? []);
    data.employerTasks = markDone(data.employerTasks ?? []);

    if (mutated) {
      localStorage.setItem("issa_roadmap", JSON.stringify(data));
    }
  } catch {
    // corrupted localStorage — ignore
  }
}

export default function DocumentsPage() {
  // ── ALL hooks first, unconditionally ─────────────────────────────────────
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [uploaded, setUploaded] = useState<Record<number, boolean>>({});
  const [showBanner, setShowBanner] = useState(false);
  const bannerDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const readyCount = DOCS.filter((d) => uploaded[d.id]).length;
  const allReady = readyCount === DOCS.length;
  const pct = Math.round((readyCount / DOCS.length) * 100);

  useEffect(() => {
    const raw = localStorage.getItem("issa_roadmap");
    if (!raw) {
      setShowEmpty(true);
      setIsReady(true);
      return;
    }
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          ready?: Record<string, boolean>;
          bannerShown?: boolean;
        };
        if (parsed.ready && typeof parsed.ready === "object") {
          const next: Record<number, boolean> = {};
          for (const doc of DOCS) {
            if (parsed.ready[String(doc.id)]) next[doc.id] = true;
          }
          setUploaded(next);
        }
        if (parsed.bannerShown) setShowBanner(true);
      }
    } catch {
      // ignore corrupted snapshot
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || showEmpty || !allReady) return;
    markDocsTaskDoneInLocalStorage();
  }, [allReady, isReady, showEmpty]);

  useEffect(() => {
    if (!isReady || showEmpty || !allReady || showBanner) return;
    if (bannerDelayRef.current) clearTimeout(bannerDelayRef.current);
    bannerDelayRef.current = setTimeout(() => {
      setShowBanner(true);
      bannerDelayRef.current = null;
    }, 1000);
    return () => {
      if (bannerDelayRef.current) clearTimeout(bannerDelayRef.current);
    };
  }, [allReady, showBanner, isReady, showEmpty]);

  useEffect(() => {
    if (!isReady || showEmpty) return;
    try {
      const ready: Record<string, boolean> = {};
      for (const id of Object.keys(uploaded)) {
        if (uploaded[Number(id)]) ready[id] = true;
      }
      localStorage.setItem(
        DOCS_STORAGE_KEY,
        JSON.stringify({ ready, bannerShown: showBanner })
      );
    } catch {
      // quota / private mode
    }
  }, [uploaded, showBanner, isReady, showEmpty]);

  // ── conditional returns AFTER all hooks ───────────────────────────────────
  if (!isReady) return <div className="flex-1" />;

  if (showEmpty) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-6">
          <DocumentTextIcon className="w-7 h-7 text-teal-600" />
        </div>
        <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">Documents</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Your document checklist is tied to your roadmap. After Compass generates your plan,
          you&apos;ll see exactly what to gather (for example passport copy, photos, degree) with
          notes, a progress bar, and a way to send everything to Issa when you&apos;re ready.
        </p>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Before this page fills in
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Finish onboarding and chat with Compass</li>
            <li>Generate your roadmap from the chat</li>
            <li>Return here to track each file and mark items ready</li>
          </ol>
        </div>
        <Link
          href="/dashboard/chat"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Go to Chat →
        </Link>
      </main>
    );
  }

  // ── helpers that depend on state (after hooks, before render) ─────────────
  const toggle = (id: number) => {
    setUploaded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const count = DOCS.filter((d) => next[d.id]).length;
      if (count < DOCS.length) setShowBanner(false);
      return next;
    });
  };

  // ── normal render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      {/* Success banner */}
      {showBanner && (
        <div className="mb-6 flex items-center justify-between gap-3 bg-green-600 text-white rounded-xl px-4 py-3">
          <p className="text-sm font-medium">
            All documents ready! Task marked as complete. ✓
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/roadmap")}
            className="shrink-0 px-3 py-1.5 bg-white text-green-700 text-xs font-semibold rounded-lg hover:bg-green-50 transition-colors"
          >
            Back to my roadmap →
          </button>
        </div>
      )}

      {/* Back arrow */}
      <Link
        href="/dashboard/roadmap"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to roadmap
      </Link>

      {/* Header */}
      <h1 className="text-xl font-display font-semibold text-gray-900 mb-1">
        Gather your documents
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Collect these before your employer sends their sponsorship documents.
      </p>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{readyCount} of {DOCS.length} documents ready</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Document cards */}
      <div className="space-y-3 mb-8">
        {DOCS.map((doc) => {
          const isUploaded = !!uploaded[doc.id];
          return (
            <div
              key={doc.id}
              className={`flex items-center justify-between gap-4 bg-white rounded-xl border px-4 py-4 transition-all ${
                isUploaded
                  ? "border-l-4 border-teal-400 border-t border-r border-b border-gray-100"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                  {isUploaded ? (
                    <p className="text-xs text-teal-600 mt-0.5 truncate">{doc.fakeFilename}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">{doc.note}</p>
                  )}
                </div>
              </div>

              {isUploaded ? (
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 shrink-0 hover:bg-teal-100 transition-colors"
                >
                  Ready ✓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 shrink-0 transition-colors"
                >
                  Add file
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA — only when all ready */}
      {allReady && (
        <button
          type="button"
          onClick={() => router.push("/dashboard/handoff")}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Send to Issa →
        </button>
      )}
    </div>
  );
}
