import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizAnswers } from "@/types";

// name is optional — users can skip it
// All other quiz keys are considered "touched" once the user has gone through the step
// (value may be empty string for skipped steps)
const REQUIRED_KEYS: (keyof QuizAnswers)[] = [
  "intent",
  "work_type",
  "nationality",
  "has_job_offer",
  "current_visa",
  "urgency",
];

export function isOnboardingComplete(answers: QuizAnswers): boolean {
  // A step is complete if the key exists in answers (even empty string = skipped)
  return REQUIRED_KEYS.every((k) => k in answers);
}

export interface OnboardingState {
  currentStep: number;
  answers: QuizAnswers;
  totalSteps: number;
  setAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 0,
      answers: {},
      totalSteps: 7,

      setAnswer: (key, value) =>
        set((state) => ({ answers: { ...state.answers, [key]: value } })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      reset: () => set({ currentStep: 0, answers: {} }),
    }),
    {
      name: "issa_onboarding",
      // totalSteps must not be persisted — it changes when questions are added/removed
      partialize: (state) => ({ currentStep: state.currentStep, answers: state.answers }),
    }
  )
);
