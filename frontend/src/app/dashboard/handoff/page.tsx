"use client";
import { useRouter } from "next/navigation";
import { GlobeAltIcon } from "@heroicons/react/24/outline";

const CHECKPOINTS = [
  { done: true,  label: "Documents received and verified" },
  { done: true,  label: "Employer documents on file" },
  { done: false, label: "Embassy submission within 24 hours" },
];

const AVATARS = [
  { initial: "D", color: "bg-violet-400" },
  { initial: "P", color: "bg-rose-400" },
  { initial: "A", color: "bg-amber-400" },
];

export default function HandoffPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      {/* Compass icon */}
      <div className="mb-6 flex justify-center">
        <GlobeAltIcon className="w-16 h-16 text-teal-500" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-display font-semibold text-gray-900">
        You&apos;re in good hands
      </h1>

      {/* Subtitle */}
      <p className="text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
        Your documents are with Issa&apos;s team. We take it from here — like ordering a Grab.
      </p>

      {/* Checkpoints */}
      <div className="mt-8 max-w-xs mx-auto flex flex-col gap-3">
        {CHECKPOINTS.map((cp, i) => (
          <div key={i} className="flex items-center gap-3">
            {cp.done ? (
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
            )}
            <p className={`text-sm text-left ${cp.done ? "text-gray-800" : "text-gray-400"}`}>
              {cp.label}
            </p>
          </div>
        ))}
      </div>

      {/* Consultant row */}
      <div className="mt-8 flex flex-col items-center">
        <div className="flex">
          {AVATARS.map((a, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full ${a.color} flex items-center justify-center text-white font-medium text-sm ring-2 ring-white ${i > 0 ? "-ml-2" : ""}`}
            >
              {a.initial}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Danaya and the Issa team are on it
        </p>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={() => router.push("/dashboard/status")}
        className="mt-10 bg-teal-600 text-white rounded-xl py-3 px-8 font-medium hover:bg-teal-700 transition-colors"
      >
        Track my application →
      </button>

      {/* Secondary link */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/chat")}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Questions? Chat with Compass →
        </button>
      </div>
    </div>
  );
}
