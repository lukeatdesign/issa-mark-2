"use client";

interface SuggestedChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function SuggestedChips({ suggestions, onSelect }: SuggestedChipsProps) {
  if (!suggestions?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          style={{ animationDelay: `${i * 60}ms` }}
          className="text-xs px-3 py-1.5 rounded-full border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 active:scale-95 transition-all animate-fade-in-up opacity-0 [animation-fill-mode:both]"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
