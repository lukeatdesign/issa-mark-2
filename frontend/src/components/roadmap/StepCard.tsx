"use client";
import { useState } from "react";
import type { Step, StepStatus } from "@/types";
import StepStatusBadge from "./StepStatus";

interface StepCardProps {
  step: Step;
  index: number;
  onStatusChange: (stepId: string, status: StepStatus) => void;
}

const STATUS_ACTIONS: Record<StepStatus, { next: StepStatus | null; label: string }> = {
  pending:     { next: "in_progress", label: "Start" },
  in_progress: { next: "done",        label: "Mark as done" },
  done:        { next: "pending",     label: "Undo" },
  blocked:     { next: null,          label: "" },
};

export default function StepCard({ step, index, onStatusChange }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const action = STATUS_ACTIONS[step.status];

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        step.status === "done"
          ? "border-green-100 bg-green-50/30"
          : step.status === "in_progress"
          ? "border-blue-200 bg-blue-50/20"
          : step.status === "blocked"
          ? "border-amber-200 bg-amber-50/20"
          : "border-gray-100 bg-white"
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left"
      >
        {/* Step number */}
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            step.status === "done"
              ? "bg-green-500 text-white"
              : step.status === "in_progress"
              ? "bg-brand-600 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {step.status === "done" ? "✓" : index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-semibold text-sm ${step.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {step.title}
            </h3>
            <StepStatusBadge status={step.status} />
          </div>
          {step.estimated_time && (
            <p className="text-xs text-gray-400 mt-0.5">{step.estimated_time}</p>
          )}
        </div>

        <svg
          className={`flex-shrink-0 w-4 h-4 text-gray-400 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          <p className="text-sm text-gray-700 mt-4 leading-relaxed">{step.description}</p>

          {step.why_it_matters && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
              <p className="text-xs font-semibold text-brand-700 mb-1">Why this matters</p>
              <p className="text-sm text-brand-800 leading-relaxed">{step.why_it_matters}</p>
            </div>
          )}

          {step.required_documents?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required documents</p>
              <ul className="space-y-1">
                {step.required_documents.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.tips?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pro tips</p>
              <ul className="space-y-2">
                {step.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-accent-500 mt-0.5 flex-shrink-0">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.official_links?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Official sources</p>
              <div className="flex flex-wrap gap-2">
                {step.official_links.map((link, i) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline bg-brand-50 px-3 py-1 rounded-full border border-brand-100"
                  >
                    {link.replace(/^https?:\/\//, "")}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status action */}
          {action.next && (
            <button
              onClick={() => onStatusChange(step.id, action.next!)}
              className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              {action.label} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
