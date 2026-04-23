"use client";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { useChatTaskPanelStore } from "@/store/chatTaskPanel";
import type { Intent, WorkType, JobOffer, CurrentVisa, Urgency } from "@/types";
import {
  BuildingOffice2Icon,
  ComputerDesktopIcon,
  BriefcaseIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  SparklesIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  ClockIcon,
  UserCircleIcon,
  MapPinIcon,
  SunIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

// ── Icon map ──────────────────────────────────────────────────────────────────

type HeroIcon = React.ComponentType<{ className?: string }>;

const OPTION_ICONS: Record<string, HeroIcon> = {
  work_company: BuildingOffice2Icon,
  work_remote: ComputerDesktopIcon,
  own_business: BriefcaseIcon,
  exploring: MagnifyingGlassIcon,
  manual: WrenchScrewdriverIcon,
  professional: AcademicCapIcon,
  creative: SparklesIcon,
  yes_thai: CheckBadgeIcon,
  yes_foreign: GlobeAltIcon,
  no: ClockIcon,
  self_employed: UserCircleIcon,
  none: MapPinIcon,
  tourist: SunIcon,
  non_b: DocumentCheckIcon,
  other: ChatBubbleLeftRightIcon,
  planning: CalendarDaysIcon,
  urgent: BoltIcon,
  __later__: ChatBubbleLeftRightIcon,
};

// ── Question definitions ──────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: "name",
    question: "First, what's your name?",
    subtitle: "We'll use this to personalise your experience throughout the app.",
    isName: true,
    options: [],
  },
  {
    key: "intent",
    question: "What brings you to Thailand?",
    subtitle: "This shapes your entire visa pathway.",
    options: [
      { value: "work_company",  label: "Work for a company here",           description: "You have or are seeking employment with a Thai-registered company." },
      { value: "work_remote",   label: "Work remotely for a company abroad", description: "Your employer is outside Thailand but you want to live here." },
      { value: "own_business",  label: "Start my own business",              description: "You plan to set up a company or be self-employed in Thailand." },
      { value: "exploring",     label: "Just exploring options",             description: "You're researching pathways and haven't decided yet." },
      { value: "__later__",     label: "I'll tell Compass in the chat",      description: "Skip for now — share details directly with the AI.", isSkip: true },
    ],
  },
  {
    key: "work_type",
    question: "What kind of work will you do?",
    subtitle: "Certain work categories have different permit requirements.",
    options: [
      { value: "manual",        label: "Manual / factory / construction",    description: "Blue-collar roles, often covered under the MOU labour pathway." },
      { value: "professional",  label: "Professional / office / technical",  description: "White-collar roles requiring a Non-B visa and work permit." },
      { value: "creative",      label: "Creative / freelance / digital",     description: "Digital nomads, designers, writers, independent contractors." },
      { value: "__later__",     label: "I'll tell Compass in the chat",      description: "Skip for now.", isSkip: true },
    ],
  },
  {
    key: "nationality",
    question: "What's your nationality?",
    subtitle: "Different countries have different visa agreements with Thailand.",
    isTypeahead: true,
    options: [],
  },
  {
    key: "has_job_offer",
    question: "Do you have a job offer in Thailand yet?",
    subtitle: "This affects which steps you can take right now.",
    options: [
      { value: "yes_thai",      label: "Yes, from a Thai company",           description: "Your employer can sponsor your work permit application." },
      { value: "yes_foreign",   label: "Yes, from a foreign company",        description: "E.g. a regional HQ — they may still be able to sponsor you." },
      { value: "no",            label: "No, still looking",                  description: "We'll guide you on what to prepare before the offer arrives." },
      { value: "self_employed", label: "I'm self-employed / freelance",      description: "You'll need to set up a company or use a special visa category." },
      { value: "__later__",     label: "I'll tell Compass in the chat",      description: "Skip for now.", isSkip: true },
    ],
  },
  {
    key: "current_visa",
    question: "What's your current visa status in Thailand?",
    subtitle: "This determines your immediate next steps.",
    options: [
      { value: "none",    label: "Not in Thailand yet",            description: "You're applying from your home country or abroad." },
      { value: "tourist", label: "Tourist visa / visa exempt",     description: "Already in Thailand on a short-stay stamp or TR visa." },
      { value: "non_b",   label: "Non-B (Business) visa",         description: "You already hold the right visa — just need the work permit." },
      { value: "other",   label: "Other — I'll explain in chat",   description: "ED visa, LTR, SMART visa, overstay, or something else." },
    ],
  },
  {
    key: "urgency",
    question: "How urgent is your situation?",
    subtitle: "We'll prioritise your roadmap accordingly.",
    options: [
      { value: "exploring", label: "Just exploring, no rush",                        description: "Researching for the future — no immediate deadline." },
      { value: "planning",  label: "Planning to move in 1–3 months",                 description: "You need a clear plan but have some time to prepare." },
      { value: "urgent",    label: "I need to sort this out urgently (< 1 month)",   description: "You're on a deadline — visa expiry, job start date, etc." },
      { value: "__later__", label: "I'll tell Compass in the chat",                  description: "Skip for now.", isSkip: true },
    ],
  },
] as const;

type QuestionKey = (typeof QUESTIONS)[number]["key"];

const NATIONALITIES = [
  { code: "MM", label: "Myanmar" }, { code: "LA", label: "Laos" },
  { code: "KH", label: "Cambodia" }, { code: "TH", label: "Thailand" },
  { code: "VN", label: "Vietnam" }, { code: "PH", label: "Philippines" },
  { code: "ID", label: "Indonesia" }, { code: "MY", label: "Malaysia" },
  { code: "SG", label: "Singapore" }, { code: "BN", label: "Brunei" },
  { code: "AU", label: "Australia" }, { code: "AT", label: "Austria" },
  { code: "BE", label: "Belgium" }, { code: "BR", label: "Brazil" },
  { code: "CA", label: "Canada" }, { code: "CL", label: "Chile" },
  { code: "CN", label: "China" }, { code: "CO", label: "Colombia" },
  { code: "HR", label: "Croatia" }, { code: "CZ", label: "Czech Republic" },
  { code: "DK", label: "Denmark" }, { code: "EG", label: "Egypt" },
  { code: "FI", label: "Finland" }, { code: "FR", label: "France" },
  { code: "DE", label: "Germany" }, { code: "GH", label: "Ghana" },
  { code: "GR", label: "Greece" }, { code: "HK", label: "Hong Kong" },
  { code: "HU", label: "Hungary" }, { code: "IN", label: "India" },
  { code: "IE", label: "Ireland" }, { code: "IL", label: "Israel" },
  { code: "IT", label: "Italy" }, { code: "JP", label: "Japan" },
  { code: "KE", label: "Kenya" }, { code: "KR", label: "South Korea" },
  { code: "MX", label: "Mexico" }, { code: "NP", label: "Nepal" },
  { code: "NL", label: "Netherlands" }, { code: "NZ", label: "New Zealand" },
  { code: "NG", label: "Nigeria" }, { code: "NO", label: "Norway" },
  { code: "PK", label: "Pakistan" }, { code: "PL", label: "Poland" },
  { code: "PT", label: "Portugal" }, { code: "RO", label: "Romania" },
  { code: "RU", label: "Russia" }, { code: "SA", label: "Saudi Arabia" },
  { code: "ZA", label: "South Africa" }, { code: "ES", label: "Spain" },
  { code: "LK", label: "Sri Lanka" }, { code: "SE", label: "Sweden" },
  { code: "CH", label: "Switzerland" }, { code: "TW", label: "Taiwan" },
  { code: "TR", label: "Turkey" }, { code: "UA", label: "Ukraine" },
  { code: "AE", label: "United Arab Emirates" }, { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" }, { code: "UZ", label: "Uzbekistan" },
  { code: "OTHER", label: "Other" },
];

const STEP_LABELS = ["Name", "Purpose", "Work", "Country", "Job offer", "Visa", "Urgency"];

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ current, total }: { current: number; total: number }) {
  const progress = total <= 1 ? 0 : current / (total - 1);

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Circles row */}
      <div className="relative">
        {/* Full track */}
        <div className="absolute top-3.5 left-3.5 right-3.5 h-0.5 bg-gray-200" />
        {/* Filled track */}
        <div
          className="absolute top-3.5 left-3.5 h-0.5 bg-brand-600 transition-all duration-500 ease-out"
          style={{ width: `calc(${progress * 100}% - ${Math.round(progress * 28)}px)` }}
        />
        {/* Circles — justify-between so they're evenly spread */}
        <div className="relative flex justify-between">
          {Array.from({ length: total }).map((_, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div
                key={i}
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ease-out ${
                  done
                    ? "bg-brand-600 border-brand-600"
                    : active
                    ? "bg-white border-brand-600"
                    : "bg-white border-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-[10px] font-bold leading-none ${active ? "text-brand-600" : "text-gray-500"}`}>
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels row — same justify-between so labels sit under their circles */}
      <div className="flex justify-between mt-1.5">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="w-7 flex justify-center">
            <span
              className={`text-[9px] font-medium leading-none transition-colors ${
                i === current ? "text-brand-600" : i < current ? "text-brand-500" : "text-gray-500"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Directional slide transition ──────────────────────────────────────────────

function SlideQuestion({
  stepKey,
  direction,
  exiting,
  children,
}: {
  stepKey: number;
  direction: "forward" | "back";
  exiting: boolean;
  children: React.ReactNode;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Exit animation — triggered by exiting=true while content is still visible
  useEffect(() => {
    if (!divRef.current || !mounted.current) return;
    const el = divRef.current;
    if (exiting) {
      el.style.transition = "transform 0.2s ease-in, opacity 0.16s ease-in";
      el.style.transform = direction === "forward" ? "translateX(-52px)" : "translateX(52px)";
      el.style.opacity = "0";
    }
  }, [exiting, direction]);

  // Position new content off-screen before paint (no flash)
  useLayoutEffect(() => {
    if (!mounted.current) return;
    if (!divRef.current) return;
    const el = divRef.current;
    el.style.transition = "none";
    el.style.transform = direction === "forward" ? "translateX(52px)" : "translateX(-52px)";
    el.style.opacity = "0";
  }, [stepKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slide new content into view
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!divRef.current) return;
    const el = divRef.current;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.24s ease";
        el.style.transform = "translateX(0)";
        el.style.opacity = "1";
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [stepKey]);

  return <div ref={divRef}>{children}</div>;
}

// ── Option card ───────────────────────────────────────────────────────────────

function OptionCard({
  label,
  description,
  icon: Icon,
  isSkip,
  disabled,
  onClick,
}: {
  label: string;
  description?: string;
  icon?: HeroIcon;
  isSkip?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (pressed || disabled) return;
    setPressed(true);
    setTimeout(onClick, 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        pressed
          ? "border-brand-600 bg-brand-600 scale-[0.985]"
          : isSkip
          ? "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
          : "border-gray-200 bg-white hover:border-brand-400 hover:bg-brand-50/50 active:scale-[0.985]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        {Icon && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            pressed
              ? "bg-white/20"
              : isSkip
              ? "bg-gray-100"
              : "bg-brand-50 group-hover:bg-brand-100"
          }`}>
            <Icon className={`w-4 h-4 transition-colors ${
              pressed ? "text-white" : isSkip ? "text-gray-500" : "text-brand-600"
            }`} />
          </div>
        )}
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug transition-colors ${
            pressed ? "text-white" : isSkip ? "text-gray-600" : "text-gray-800 group-hover:text-brand-700"
          }`}>
            {label}
          </p>
          {description && (
            <p className={`text-xs mt-0.5 leading-snug transition-colors ${
              pressed ? "text-brand-100" : "text-gray-500"
            }`}>
              {description}
            </p>
          )}
        </div>
        {/* Arrow */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
            pressed
              ? "text-white translate-x-1"
              : isSkip
              ? "text-gray-400"
              : "text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5"
          }`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ── Name step ─────────────────────────────────────────────────────────────────

function NameStep({
  value,
  onChange,
  onContinue,
  onSkip,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim() && !disabled) onContinue();
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="e.g. Nozim"
        disabled={disabled}
        className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-600 transition-colors bg-white disabled:opacity-50"
        autoComplete="given-name"
      />
      <button
        type="button"
        onClick={onContinue}
        disabled={!value.trim() || disabled}
        className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        Continue →
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
      >
        I'll share my name later in the chat
      </button>
    </div>
  );
}

// ── Nationality typeahead ─────────────────────────────────────────────────────

function NationalityTypeahead({
  value,
  onSelect,
  onSkip,
  onContinue,
  disabled,
}: {
  value: string;
  onSelect: (code: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const initialLabel = NATIONALITIES.find((n) => n.code === value)?.label ?? "";
  const [query, setQuery] = useState(initialLabel);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const matches = query.trim().length > 0
    ? NATIONALITIES.filter((n) =>
        n.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    setHighlighted(0);
    // Clear stored code if user edits the text
    if (value) onSelect("");
  };

  const handleSelect = (nat: { code: string; label: string }) => {
    setQuery(nat.label);
    setOpen(false);
    onSelect(nat.code);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && matches.length > 0 && matches[highlighted]) {
        handleSelect(matches[highlighted]);
      } else if (!open && value) {
        onContinue();
      }
      return;
    }
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Type your country…"
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-600 bg-white text-sm transition-colors disabled:opacity-50"
          autoComplete="off"
        />
        {open && matches.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto"
          >
            {matches.map((n, i) => (
              <li
                key={n.code}
                onMouseDown={() => handleSelect(n)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  i === highlighted
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {n.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={!value || disabled}
        className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Continue →
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        I'll share my nationality later in the chat
      </button>
    </div>
  );
}

// ── Registration modal ────────────────────────────────────────────────────────

function RegisterModal({ onSuccess }: { onSuccess: (token: string, username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/register", { username: username.trim(), password });
      onSuccess(res.data.token, res.data.username);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${visible ? "bg-black/50" : "bg-black/0"}`}>
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 transition-all duration-300 ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>
        <div className="mb-6">
          <h2 className="text-xl font-display font-semibold text-gray-900">Create your account to proceed</h2>
          <p className="text-sm text-gray-600 mt-1">You're almost there — save your progress and get your personalized roadmap.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
            <input type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. johndoe" required minLength={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading || !username || !password}
            className="w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</span> : "Create account →"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">No email verification needed — this is a demo account.</p>
      </div>
    </div>
  );
}

const APP_STORAGE_KEYS = [
  "wayfarer_roadmap", "wayfarer_overview_cache", "wayfarer_docs_count", "wayfarer_active_task",
  "wayfarer_documents_checklist", "wayfarer_status_demo", "wayfarer_chat_task_panel",
  "wayfarer_chat_threads", "wayfarer_subtask_progress",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, answers, setAnswer, nextStep, prevStep, totalSteps } = useOnboardingStore();
  const { isLoggedIn, lastUsername, setAuth, clearAuth } = useAuthStore();
  const resetChat = useChatStore((s) => s.reset);
  const resetTaskPanel = useChatTaskPanelStore((s) => s.setGeneralHelp);
  const [showRegister, setShowRegister] = useState(false);
  const [showProceedingScreen, setShowProceedingScreen] = useState(false);
  const [nameInput, setNameInput] = useState((answers as Record<string, string>)["name"] ?? "");

  // Animation state
  const [animDirection, setAnimDirection] = useState<"forward" | "back">("forward");
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animLock = useRef(false);

  const question = QUESTIONS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const nextQuestion = currentStep < totalSteps - 1 ? QUESTIONS[currentStep + 1] : null;

  // ── advance helpers ──────────────────────────────────────────────────────────

  const advance = () => {
    if (isLastStep) {
      if (isLoggedIn) {
        setShowProceedingScreen(true);
        setTimeout(() => router.push("/dashboard/chat"), 2500);
      } else {
        setShowRegister(true);
      }
    } else {
      nextStep();
    }
  };

  const triggerForward = () => {
    if (animLock.current) return;
    animLock.current = true;
    setIsAnimating(true);
    setAnimDirection("forward");
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      advance();
      setTimeout(() => { animLock.current = false; setIsAnimating(false); }, 350);
    }, 210);
  };

  const triggerBack = () => {
    if (animLock.current) return;
    animLock.current = true;
    setIsAnimating(true);
    setAnimDirection("back");
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      prevStep();
      setTimeout(() => { animLock.current = false; setIsAnimating(false); }, 350);
    }, 210);
  };

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleOptionSelect = (value: string) => {
    const key = question.key as QuestionKey;
    if (value === "__later__") {
      setAnswer(key, "" as never);
    } else {
      setAnswer(key, value as Intent & WorkType & JobOffer & CurrentVisa & Urgency & string);
    }
    // OptionCard handles its own 400ms delay; triggerForward is called after
  };

  const handleNameContinue = () => {
    setAnswer("name" as QuestionKey, nameInput.trim() as never);
    triggerForward();
  };

  const handleNameSkip = () => {
    setAnswer("name" as QuestionKey, "" as never);
    triggerForward();
  };

  const handleDropdownContinue = () => {
    triggerForward();
  };

  const handleDropdownSkip = () => {
    setAnswer("nationality", "OTHER");
    triggerForward();
  };

  const handleExitOnboarding = () => {
    if (isLoggedIn) clearAuth();
    router.replace("/");
  };

  const handleRegistered = (token: string, username: string) => {
    resetChat();
    resetTaskPanel();
    if (lastUsername && lastUsername !== username) {
      APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    setAuth(token, username);
    setShowRegister(false);
    setShowProceedingScreen(true);
    setTimeout(() => router.push("/dashboard/chat"), 2500);
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <span className="font-display font-bold text-base text-brand-900">Wayfarer</span>
          {currentStep === 0 ? (
            <button type="button" onClick={handleExitOnboarding}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium">
              {isLoggedIn ? "Sign out" : "Cancel"}
            </button>
          ) : (
            <span className="text-xs text-gray-600 font-medium">
              Step {currentStep + 1} of {totalSteps}
            </span>
          )}
        </div>

        {/* Stepper */}
        <div className="bg-white border-b border-gray-100 px-8 pt-4 pb-5 flex-shrink-0">
          <Stepper current={currentStep} total={totalSteps} />
        </div>

        {/* Question area */}
        <main className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
          <div className="w-full max-w-lg">
            <SlideQuestion stepKey={currentStep} direction={animDirection} exiting={isExiting}>
              {/* Question meta row: counter + next preview */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <p className="text-xs font-bold text-brand-600 uppercase tracking-widest whitespace-nowrap">
                  Question {currentStep + 1} of {totalSteps}
                </p>
                {nextQuestion && (
                  <p className="text-xs text-gray-600 text-right truncate min-w-0">
                    Next:{" "}
                    <span className="font-medium text-gray-700">
                      {nextQuestion.question}
                    </span>
                  </p>
                )}
              </div>

              {/* Title + subtitle */}
              <div className="mb-6">
                <h2 className="text-2xl font-display font-semibold text-gray-900 leading-snug">
                  {question.question}
                </h2>
                {"subtitle" in question && question.subtitle && (
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{question.subtitle}</p>
                )}
              </div>

              {/* Name step */}
              {"isName" in question && question.isName ? (
                <NameStep
                  value={nameInput}
                  onChange={setNameInput}
                  onContinue={handleNameContinue}
                  onSkip={handleNameSkip}
                  disabled={isAnimating}
                />
              ) : "isTypeahead" in question && question.isTypeahead ? (
                /* Nationality typeahead */
                <NationalityTypeahead
                  value={(answers as Record<string, string>)["nationality"] ?? ""}
                  onSelect={(code) => setAnswer("nationality", code)}
                  onSkip={handleDropdownSkip}
                  onContinue={handleDropdownContinue}
                  disabled={isAnimating}
                />
              ) : (
                /* Choice cards — click to advance immediately */
                <div className="space-y-2.5">
                  {"options" in question && question.options.map((opt) => {
                    const Icon = OPTION_ICONS[opt.value];
                    return (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        description={"description" in opt ? opt.description : undefined}
                        icon={Icon}
                        isSkip={"isSkip" in opt ? opt.isSkip : false}
                        disabled={isAnimating}
                        onClick={() => {
                          handleOptionSelect(opt.value);
                          triggerForward();
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </SlideQuestion>
          </div>
        </main>

        {/* Footer: back button */}
        {currentStep > 0 && (
          <div className="px-6 pb-8 flex-shrink-0">
            <div className="max-w-lg mx-auto">
              <button
                type="button"
                onClick={triggerBack}
                disabled={isAnimating}
                className="w-full py-2.5 flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors disabled:opacity-40 disabled:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to previous question
              </button>
              <button
                type="button"
                onClick={handleExitOnboarding}
                className="w-full py-2.5 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isLoggedIn ? "Sign out" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showRegister && <RegisterModal onSuccess={handleRegistered} />}

      {showProceedingScreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5 animate-fade-in">
          <span className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <div className="text-center space-y-2 max-w-xs">
            <p className="text-base font-semibold text-gray-900">Taking you to your guide…</p>
            <p className="text-sm text-gray-500 leading-relaxed">Ask further questions or share more details to generate your personalized roadmap.</p>
          </div>
        </div>
      )}
    </>
  );
}
