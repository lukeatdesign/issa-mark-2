import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizAnswers } from "@/types";

const REQUIRED_KEYS: (keyof QuizAnswers)[] = [
  "intent",
  "work_type",
  "nationality",
  "has_job_offer",
  "current_visa",
  "urgency",
];

export function isOnboardingComplete(answers: QuizAnswers): boolean {
  return REQUIRED_KEYS.every((k) => !!answers[k]);
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
      totalSteps: 6,

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
    { name: "issa_onboarding" }
  )
);
