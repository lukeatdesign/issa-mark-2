"use client";

interface QuizOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

export default function QuizOption({ label, description, selected, onClick }: QuizOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-900"
          : "border-gray-200 bg-white hover:border-brand-300 hover:bg-gray-50 text-gray-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors ${
            selected ? "border-brand-600 bg-brand-600" : "border-gray-300"
          }`}
        >
          {selected && (
            <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="4" />
            </svg>
          )}
        </span>
        <div>
          <p className="font-medium text-sm leading-snug">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
    </button>
  );
}
