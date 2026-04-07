"use client";

interface QuizShellProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  /** Step 0 only: secondary action under Continue (Cancel / Sign Out). */
  exitAction?: { label: string; onClick: () => void };
  children: React.ReactNode;
}

export default function QuizShell({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canGoNext,
  isLastStep,
  isSubmitting,
  exitAction,
  children,
}: QuizShellProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-full bg-brand-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : (
          <span className="w-px shrink-0" aria-hidden />
        )}
        <span className="text-xs text-gray-400 font-medium">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      {/* Footer */}
      <div className="px-6 pb-8">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting you with Compass…
              </span>
            ) : isLastStep ? (
              "Meet your Compass guide →"
            ) : (
              "Continue →"
            )}
          </button>
          {exitAction ? (
            <button
              type="button"
              onClick={exitAction.onClick}
              className="mt-3 w-full py-2.5 text-sm font-medium text-gray-500 bg-transparent hover:text-gray-800 transition-colors rounded-xl"
            >
              {exitAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
