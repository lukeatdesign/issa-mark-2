"use client";
import type { Step, StepStatus } from "@/types";
import StepCard from "./StepCard";

interface StepperListProps {
  steps: Step[];
  onStatusChange: (stepId: string, status: StepStatus) => void;
}

export default function StepperList({ steps, onStatusChange }: StepperListProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-gray-400">No steps found for your path.</p>;
  }

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{doneCount} of {steps.length} steps completed</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {steps.map((step, i) => (
        <StepCard
          key={step.id}
          step={step}
          index={i}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
