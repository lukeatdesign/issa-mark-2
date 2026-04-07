"use client";
import QuizOption from "./QuizOption";

export interface QuizOptionDef {
  value: string;
  label: string;
  description?: string;
}

export interface QuizQuestionProps {
  question: string;
  subtitle?: string;
  options: QuizOptionDef[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  /** If true, renders a searchable dropdown instead of radio options */
  isDropdown?: boolean;
}

// ASEAN-first nationality list for the dropdown
const NATIONALITIES: { code: string; label: string }[] = [
  { code: "MM", label: "Myanmar" },
  { code: "LA", label: "Laos" },
  { code: "KH", label: "Cambodia" },
  { code: "TH", label: "Thailand" },
  { code: "VN", label: "Vietnam" },
  { code: "PH", label: "Philippines" },
  { code: "ID", label: "Indonesia" },
  { code: "MY", label: "Malaysia" },
  { code: "SG", label: "Singapore" },
  { code: "BN", label: "Brunei" },
  // Global (alphabetical)
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
  { code: "CN", label: "China" },
  { code: "DK", label: "Denmark" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IN", label: "India" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "NL", label: "Netherlands" },
  { code: "NO", label: "Norway" },
  { code: "NZ", label: "New Zealand" },
  { code: "RU", label: "Russia" },
  { code: "SE", label: "Sweden" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "OTHER", label: "Other" },
];

export default function QuizQuestion({
  question,
  subtitle,
  options,
  selectedValue,
  onSelect,
  isDropdown,
}: QuizQuestionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-semibold text-gray-900 leading-snug">
          {question}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>

      {isDropdown ? (
        <select
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-brand-600 bg-white"
          value={selectedValue ?? ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="" disabled>
            Select your nationality…
          </option>
          {NATIONALITIES.map((n) => (
            <option key={n.code} value={n.code}>
              {n.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-3">
          {options.map((opt) => (
            <QuizOption
              key={opt.value}
              label={opt.label}
              description={opt.description}
              selected={selectedValue === opt.value}
              onClick={() => onSelect(opt.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
