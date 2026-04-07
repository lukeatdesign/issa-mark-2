import type { RoadmapData } from "@/lib/api";

const STORAGE_KEY = "issa_roadmap";

/** Merge checkbox state into roadmap tasks and save to localStorage. */
export function persistRoadmapTaskCompletion(
  base: RoadmapData,
  userChecked: Record<number, boolean>,
  employerChecked: Record<number, boolean>
): void {
  try {
    const next: RoadmapData = {
      ...base,
      userTasks: base.userTasks.map((t) => ({
        ...t,
        done: !!userChecked[t.id],
      })),
      employerTasks: base.employerTasks.map((t) => ({
        ...t,
        done: !!employerChecked[t.id],
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode
  }
}
