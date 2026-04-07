import type { StepStatus } from "@/types";

const CONFIG: Record<StepStatus, { icon: string; label: string; classes: string }> = {
  done:        { icon: "✅", label: "Completed",   classes: "bg-green-50 text-green-700 border-green-200" },
  in_progress: { icon: "🔄", label: "In progress", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  pending:     { icon: "⏳", label: "Upcoming",    classes: "bg-gray-50 text-gray-500 border-gray-200" },
  blocked:     { icon: "⚠️", label: "Blocked",     classes: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function StepStatusBadge({ status }: { status: StepStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.classes}`}>
      <span>{c.icon}</span>
      {c.label}
    </span>
  );
}
