"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApprovedPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wayfarer_roadmap");
      if (raw) setUserName(JSON.parse(raw)?.userName ?? null);
    } catch { /* corrupted — ignore */ }
    try {
      const key = "wayfarer_status_demo";
      const cur = JSON.parse(localStorage.getItem(key) || "{}") as {
        demoStage?: number;
        reachedApproved?: boolean;
      };
      localStorage.setItem(
        key,
        JSON.stringify({ ...cur, reachedApproved: true })
      );
    } catch { /* ignore */ }
    // Single rAF ensures the initial scale-0 class is painted before we add scale-100
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-6 py-16 flex flex-col items-center">

      {/* Animated checkmark */}
      <div
        style={{
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.6s ease",
          transform: visible ? "scale(1)" : "scale(0)",
          opacity: visible ? 1 : 0,
        }}
        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center"
      >
        <span className="text-white text-4xl leading-none">✓</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-display font-semibold text-gray-900 mt-8 text-center">
        Visa approved!
      </h1>

      {/* Subtitle */}
      <p className="text-xl text-teal-600 mt-3 text-center">
        Welcome to Bangkok, {userName ?? "there"}.
      </p>

      {/* Details card */}
      <div className="border border-gray-100 rounded-2xl p-6 mt-8 w-full">
        <div className="grid grid-cols-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Visa type</p>
            <p className="text-base font-medium text-gray-900">Non-B</p>
          </div>
          <div className="border-x border-gray-100 px-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Valid for</p>
            <p className="text-base font-medium text-gray-900">90 days</p>
          </div>
          <div className="pl-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Issued</p>
            <p className="text-base font-medium text-gray-900">Apr 21, 2026</p>
          </div>
        </div>
      </div>

      {/* Warm message */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mt-6 w-full">
        <p className="text-sm text-amber-900 leading-relaxed italic">
          From a job offer in Phnom Penh to working legally in Bangkok — every document,
          every step, every question answered. You did it, {userName ?? "there"}. Wayfarer was with you
          the whole way.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-8 w-full flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/roadmap")}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
        >
          View my roadmap →
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/chat")}
          className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
        >
          Chat with Compass →
        </button>
      </div>
    </div>
  );
}
