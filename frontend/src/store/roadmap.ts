import { create } from "zustand";
import type { Step, StepStatus } from "@/types";
import api from "@/lib/api";

interface RoadmapState {
  steps: Step[];
  loading: boolean;
  setSteps: (steps: Step[]) => void;
  updateStepStatus: (stepId: string, status: StepStatus, userId: string) => Promise<void>;
}

export const useRoadmapStore = create<RoadmapState>((set) => ({
  steps: [],
  loading: false,

  setSteps: (steps) => set({ steps }),

  updateStepStatus: async (stepId, status, userId) => {
    // Optimistic update
    set((state) => ({
      steps: state.steps.map((s) => (s.id === stepId ? { ...s, status } : s)),
    }));
    try {
      await api.patch("/roadmap/step", { user_id: userId, step_id: stepId, status });
    } catch {
      // Revert on failure — refetch would be ideal here
    }
  },
}));
