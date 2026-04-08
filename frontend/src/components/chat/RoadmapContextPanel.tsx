"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { RoadmapData, QuizAnswers } from "@/lib/api";

// ── option maps ───────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { value: "work_company",  label: "Work for a Thai company" },
  { value: "work_remote",   label: "Work remotely for a foreign company" },
  { value: "own_business",  label: "Start my own business" },
  { value: "exploring",     label: "Just exploring options" },
];
const WORK_TYPE_OPTIONS = [
  { value: "manual",        label: "Manual / factory / construction" },
  { value: "professional",  label: "Professional / office / technical" },
  { value: "creative",      label: "Creative / freelance / digital" },
];
const JOB_OFFER_OPTIONS = [
  { value: "yes_thai",      label: "Yes — from a Thai company" },
  { value: "yes_foreign",   label: "Yes — from a foreign company" },
  { value: "no",            label: "No job offer yet" },
  { value: "self_employed", label: "Self-employed / freelance" },
];
const VISA_OPTIONS = [
  { value: "none",    label: "Not in Thailand yet" },
  { value: "tourist", label: "Tourist visa / visa exempt" },
  { value: "non_b",   label: "Non-B (Business) visa" },
  { value: "other",   label: "Other" },
];
const URGENCY_OPTIONS = [
  { value: "exploring", label: "Just exploring, no rush" },
  { value: "planning",  label: "Planning to move in 1–3 months" },
  { value: "urgent",    label: "Need to sort this urgently (< 1 month)" },
];

function labelFor(options: { value: string; label: string }[], value?: string) {
  return options.find((o) => o.value === value)?.label ?? value ?? "—";
}

// ── field primitives ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SelectField({
  value, onChange, options, placeholder = "Select…",
}: {
  value?: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-brand-400"
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TextInputField({
  value, onChange, placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:border-brand-400"
    />
  );
}

// ── context form ──────────────────────────────────────────────────────────────

function ContextForm({
  values,
  onChange,
}: {
  values: QuizAnswers;
  onChange: (patch: Partial<QuizAnswers>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Field label="Your name (optional)">
          <TextInputField
            value={(values as QuizAnswers & { name?: string }).name as string | undefined}
            onChange={(v) => onChange({ ...(values as object), name: v } as Partial<QuizAnswers>)}
            placeholder="e.g. Nozim"
          />
        </Field>
        <Field label="Nationality *">
          <TextInputField
            value={values.nationality}
            onChange={(v) => onChange({ nationality: v })}
            placeholder="e.g. Cambodian"
          />
        </Field>
        <Field label="Purpose in Thailand *">
          <SelectField
            value={values.intent}
            onChange={(v) => onChange({ intent: v as QuizAnswers["intent"] })}
            options={INTENT_OPTIONS}
          />
        </Field>
        <Field label="Type of work">
          <SelectField
            value={values.work_type}
            onChange={(v) => onChange({ work_type: v as QuizAnswers["work_type"] })}
            options={WORK_TYPE_OPTIONS}
          />
        </Field>
        <Field label="Job offer status *">
          <SelectField
            value={values.has_job_offer}
            onChange={(v) => onChange({ has_job_offer: v as QuizAnswers["has_job_offer"] })}
            options={JOB_OFFER_OPTIONS}
          />
        </Field>
        <Field label="Current visa status">
          <SelectField
            value={values.current_visa}
            onChange={(v) => onChange({ current_visa: v as QuizAnswers["current_visa"] })}
            options={VISA_OPTIONS}
          />
        </Field>
        <Field label="How urgent? *">
          <SelectField
            value={values.urgency}
            onChange={(v) => onChange({ urgency: v as QuizAnswers["urgency"] })}
            options={URGENCY_OPTIONS}
          />
        </Field>
        <Field label="Target timeline">
          <TextInputField
            value={(values as QuizAnswers & { timeline?: string }).timeline as string | undefined}
            onChange={(v) => onChange({ ...(values as object), timeline: v } as Partial<QuizAnswers>)}
            placeholder="e.g. 6 weeks"
          />
        </Field>
      </div>

      {/* Additional context — auto-populated from chat, editable */}
      <Field label="Additional context">
        <textarea
          value={values.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Anything else Compass should know — your employer's details, specific concerns, salary, timeline constraints, etc. This is automatically filled as you chat."
          rows={5}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:border-brand-400 resize-none leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-1">
          Updated automatically from your chat conversation.
        </p>
      </Field>
    </div>
  );
}

// ── modal (form / edit / confirm-regen) ───────────────────────────────────────

type ModalView = "form" | "edit" | "confirm-regen";

function ContextModal({
  view,
  formValues,
  onPatch,
  onClose,
  onFormSubmit,
  onEditSave,
  onConfirmRegen,
  onBackToEdit,
  isGenerating,
}: {
  view: ModalView;
  formValues: QuizAnswers;
  onPatch: (patch: Partial<QuizAnswers>) => void;
  onClose: () => void;
  onFormSubmit: () => void;
  onEditSave: () => void;
  onConfirmRegen: () => void;
  onBackToEdit: () => void;
  isGenerating: boolean;
}) {
  const formReady =
    !!formValues.nationality && !!formValues.has_job_offer && !!formValues.urgency;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-xl">

        {/* ── confirm-regen view ── */}
        {view === "confirm-regen" && (
          <>
            <div className="flex-shrink-0 flex items-start justify-between px-6 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Regenerate your roadmap?</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Updating this context will rebuild your roadmap. Tasks you&apos;ve already
                    completed will stay ticked where the step still exists. New or changed
                    steps will reset to unchecked.
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500 ml-3 flex-shrink-0">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-shrink-0 px-6 pb-5 flex gap-2">
              <button
                type="button"
                onClick={onConfirmRegen}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl py-2.5 transition-colors"
              >
                {isGenerating ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Regenerating…</>
                ) : "Yes, regenerate roadmap"}
              </button>
              <button
                type="button"
                onClick={onBackToEdit}
                className="px-4 text-sm border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl py-2.5 transition-colors"
              >
                Go back
              </button>
            </div>
          </>
        )}

        {/* ── form / edit view ── */}
        {(view === "form" || view === "edit") && (
          <>
            {/* Header — fixed */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-2 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {view === "form" ? "Fill in your context" : "Edit roadmap context"}
              </h2>
              <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ContextForm values={formValues} onChange={onPatch} />
              <p className="text-xs text-gray-400 mt-4">Fields marked * are required to generate your roadmap.</p>
            </div>

            {/* Footer — fixed */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={view === "form" ? onFormSubmit : onEditSave}
                disabled={view === "form" ? !formReady : false}
                className="flex-1 text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl py-2.5 transition-colors"
              >
                {view === "form" ? "Save context" : "Save & review changes →"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 text-sm border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── readiness signals (in popover) ────────────────────────────────────────────

function ReadinessSignals({ hasNationality, hasTimeline, hasEmployer, chatReady, assistantCount, minReplies }: {
  hasNationality: boolean; hasTimeline: boolean; hasEmployer: boolean;
  chatReady: boolean; assistantCount: number; minReplies: number;
}) {
  const remaining = Math.max(0, minReplies - assistantCount);
  const signals = [
    { label: "Nationality",         met: hasNationality },
    { label: "Timeline / urgency",  met: hasTimeline },
    { label: "Job / employer info", met: hasEmployer },
    {
      label: chatReady
        ? "Chatted with Compass"
        : `Chat a bit more (${remaining} exchange${remaining === 1 ? "" : "s"} left)`,
      met: chatReady,
    },
  ];
  return (
    <div className="space-y-1.5 my-3">
      {signals.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${s.met ? "bg-emerald-500" : "bg-gray-200"}`}>
            {s.met && (
              <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className={`text-xs ${s.met ? "text-gray-700" : "text-gray-400"}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── context summary (in popover) ──────────────────────────────────────────────

function ContextSummary({ answers }: { answers: QuizAnswers }) {
  const rows = [
    { label: "Nationality", value: answers.nationality },
    { label: "Purpose",     value: labelFor(INTENT_OPTIONS, answers.intent) },
    { label: "Work type",   value: labelFor(WORK_TYPE_OPTIONS, answers.work_type) },
    { label: "Job offer",   value: labelFor(JOB_OFFER_OPTIONS, answers.has_job_offer) },
    { label: "Visa",        value: labelFor(VISA_OPTIONS, answers.current_visa) },
    { label: "Urgency",     value: labelFor(URGENCY_OPTIONS, answers.urgency) },
  ].filter((r) => r.value && r.value !== "—");

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 my-3">
      {rows.map((r) => (
        <div key={r.label}>
          <p className="text-xs text-gray-400">{r.label}</p>
          <p className="text-xs font-medium text-gray-700 truncate">{r.value}</p>
        </div>
      ))}
    </div>
  );
}

const BUTTON_SPARKLES = [
  { style: { top: "-7px", left: "15%" },                              delay: "0ms"   },
  { style: { top: "-7px", left: "50%", transform: "translateX(-50%)" }, delay: "50ms"  },
  { style: { top: "-7px", right: "15%" },                             delay: "25ms"  },
  { style: { bottom: "-7px", left: "15%" },                           delay: "80ms"  },
  { style: { bottom: "-7px", left: "50%", transform: "translateX(-50%)" }, delay: "100ms" },
  { style: { bottom: "-7px", right: "15%" },                          delay: "40ms"  },
];

// ── main component ────────────────────────────────────────────────────────────

type PopoverView = "status";
type View = PopoverView | ModalView;

interface Props {
  hasNationality: boolean;
  hasTimeline: boolean;
  hasEmployerContext: boolean;
  chatReady: boolean;
  minReplies: number;
  assistantCount: number;
  quizAnswers: QuizAnswers;
  roadmap: RoadmapData | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onUpdateAnswers: (answers: QuizAnswers) => void;
  onRegenerateWithNewContext: (answers: QuizAnswers) => void;
}

export default function RoadmapContextPanel({
  hasNationality,
  hasTimeline,
  hasEmployerContext,
  chatReady,
  minReplies,
  assistantCount,
  quizAnswers,
  roadmap,
  isGenerating,
  onGenerate,
  onUpdateAnswers,
  onRegenerateWithNewContext,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("status");
  const [formValues, setFormValues] = useState<QuizAnswers>({ ...quizAnswers });
  const [celebrating, setCelebrating] = useState(false);
  const [isFirstTimeOpen, setIsFirstTimeOpen] = useState(false);
  const [showLaterToast, setShowLaterToast] = useState(false);

  const contextSignals = [hasNationality, hasTimeline, hasEmployerContext];
  const signalCount = contextSignals.filter(Boolean).length;
  const isReady = signalCount === 3 && chatReady;
  const hasRoadmap = !!roadmap;

  const mountedRef = useRef(false);
  const prevIsReadyRef = useRef(false);
  const prevHasRoadmapRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const laterToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevIsReadyRef.current = isReady;
      prevHasRoadmapRef.current = hasRoadmap;
      return;
    }
    const justReady = isReady && !prevIsReadyRef.current;
    const justGotRoadmap = hasRoadmap && !prevHasRoadmapRef.current;
    prevIsReadyRef.current = isReady;
    prevHasRoadmapRef.current = hasRoadmap;
    if (justReady || justGotRoadmap) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 800);
      if (justReady && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setView("status");
        setOpen(true);
        setIsFirstTimeOpen(true);
        setShowLaterToast(false);
      }
      return () => clearTimeout(t);
    }
  }, [isReady, hasRoadmap]);

  useEffect(() => () => {
    if (laterToastTimerRef.current) clearTimeout(laterToastTimerRef.current);
  }, []);

  const handleLater = () => {
    setOpen(false);
    setIsFirstTimeOpen(false);
    setShowLaterToast(true);
    if (laterToastTimerRef.current) clearTimeout(laterToastTimerRef.current);
    laterToastTimerRef.current = setTimeout(() => setShowLaterToast(false), 3000);
  };

  const patchForm = (patch: Partial<QuizAnswers>) =>
    setFormValues((prev) => ({ ...prev, ...patch }));

  const closeModal = () => setView("status");

  const openModal = (v: ModalView) => {
    setFormValues({ ...quizAnswers });
    setView(v);
  };

  const handleFormSubmit = () => {
    onUpdateAnswers(formValues);
    closeModal();
  };

  const handleConfirmRegen = () => {
    onRegenerateWithNewContext(formValues);
    closeModal();
    setOpen(false);
  };

  const togglePopover = () => {
    setView("status");
    setOpen((v) => !v);
  };

  // ── toggle button ─────────────────────────────────────────────────────────

  let buttonClass: string;
  let buttonContent: React.ReactNode;

  if (hasRoadmap) {
    buttonClass = "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors";
    buttonContent = (
      <>
        <CheckCircleIcon className="w-3.5 h-3.5" />
        Roadmap ready
        {open ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUpIcon className="w-3 h-3" />}
      </>
    );
  } else if (isReady) {
    buttonClass = "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors";
    buttonContent = (
      <>
        <MapIcon className="w-3.5 h-3.5" />
        Ready to generate
        {open ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUpIcon className="w-3 h-3" />}
      </>
    );
  } else {
    const totalMet = signalCount + (chatReady ? 1 : 0);
    buttonClass = "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors";
    buttonContent = (
      <>
        <MapIcon className="w-3.5 h-3.5 text-gray-400" />
        Roadmap context
        <span className="ml-0.5 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
          {totalMet}
        </span>
        {open ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronUpIcon className="w-3 h-3" />}
      </>
    );
  }

  // ── popover content (status view only) ───────────────────────────────────

  let popoverContent: React.ReactNode = null;

  if (view === "status") {
    if (hasRoadmap) {
      popoverContent = (
        <div className="w-72">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-sm font-semibold text-gray-800">Your roadmap is ready</p>
              <p className="text-xs text-gray-400 mt-0.5">Based on the context below.</p>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => openModal("edit")}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-0.5"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
                Edit
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 mt-0.5">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <ContextSummary answers={quizAnswers} />
          <Link
            href="/dashboard/roadmap"
            className="block w-full text-center text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg py-2 transition-colors"
          >
            View my roadmap →
          </Link>
        </div>
      );
    } else if (isReady) {
      if (isFirstTimeOpen) {
        popoverContent = (
          <div className="w-80">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-sm font-semibold text-gray-800">Your roadmap is ready to generate!</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Compass has enough context to build your personalised plan.</p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setIsFirstTimeOpen(false); }}
                className="text-gray-300 hover:text-gray-500 ml-2 mt-0.5 flex-shrink-0"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <ContextSummary answers={quizAnswers} />
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => { onGenerate(); setOpen(false); setIsFirstTimeOpen(false); }}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg py-2.5 transition-colors"
              >
                {isGenerating ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                ) : "Generate now →"}
              </button>
              <button
                type="button"
                onClick={handleLater}
                className="w-full text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg py-2 transition-colors"
              >
                Later, I need to talk a bit more
              </button>
            </div>
          </div>
        );
      } else {
        popoverContent = (
          <div className="w-80">
            <div className="flex items-start justify-between mb-0.5">
              <p className="text-sm font-semibold text-gray-800">Ready to generate</p>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 ml-2 flex-shrink-0">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Compass has enough context.</p>
            <ContextSummary answers={quizAnswers} />
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg py-2 transition-colors"
              >
                {isGenerating ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                ) : "Generate →"}
              </button>
              <button
                type="button"
                onClick={() => openModal("edit")}
                className="px-2.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        );
      }
    } else {
      popoverContent = (
        <div className="w-64">
          <div className="flex items-start justify-between mb-0.5">
            <p className="text-sm font-semibold text-gray-800">Not ready yet</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 ml-2 flex-shrink-0">
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-400">Chat a bit more, or fill in manually.</p>
          <ReadinessSignals
            hasNationality={hasNationality}
            hasTimeline={hasTimeline}
            hasEmployer={hasEmployerContext}
            chatReady={chatReady}
            assistantCount={assistantCount}
            minReplies={minReplies}
          />
          <button
            type="button"
            onClick={() => openModal("form")}
            className="w-full text-xs font-medium border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-lg py-2 transition-colors"
          >
            Fill in manually →
          </button>
        </div>
      );
    }
  }

  const isModalOpen = view === "form" || view === "edit" || view === "confirm-regen";

  return (
    <div className="px-6 pb-2 flex-shrink-0">
      {/* Popover — hugs content, sits above button */}
      {open && !isModalOpen && popoverContent && (
        <div className="mb-2 inline-block bg-white border border-gray-200 rounded-2xl shadow-md p-4">
          {popoverContent}
        </div>
      )}

      {/* "Later" toast */}
      {showLaterToast && (
        <div className="mb-2 inline-flex items-start gap-2 bg-white border border-gray-200 shadow-sm text-gray-600 text-xs rounded-xl px-3.5 py-2.5 max-w-xs leading-relaxed animate-fade-in">
          <span className="mt-px">💡</span>
          <span>You can generate your roadmap whenever you feel ready.</span>
        </div>
      )}

      {/* Toggle button */}
      <div className="relative w-fit">
        <button
          type="button"
          onClick={togglePopover}
          className={`${buttonClass} ${celebrating ? "animate-celebrate-pop" : ""}`}
        >
          {buttonContent}
        </button>
        {celebrating && BUTTON_SPARKLES.map((cfg, k) => (
          <span
            key={k}
            className={`absolute w-1.5 h-1.5 rounded-full animate-sparkle-fade pointer-events-none ${
              hasRoadmap ? "bg-teal-400" : "bg-brand-400"
            }`}
            style={{ ...cfg.style, animationDelay: cfg.delay }}
          />
        ))}
      </div>

      {/* Modal — form / edit / confirm-regen */}
      {isModalOpen && (
        <ContextModal
          view={view as ModalView}
          formValues={formValues}
          onPatch={patchForm}
          onClose={closeModal}
          onFormSubmit={handleFormSubmit}
          onEditSave={() => setView("confirm-regen")}
          onConfirmRegen={handleConfirmRegen}
          onBackToEdit={() => setView("edit")}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
