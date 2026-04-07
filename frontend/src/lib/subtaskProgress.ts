/**
 * Persists per-step checkbox state for roadmap tasks (Chat panel + My Roadmap).
 * Key: user:taskId | employer:taskId | title:<normalized title>
 */

const STORAGE_KEY = "issa_subtask_progress";

type PersistShape = {
  v: 1;
  tasks: Record<string, Record<string, boolean>>;
};

function loadStore(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, tasks: {} };
    const data = JSON.parse(raw) as PersistShape;
    if (!data.tasks || typeof data.tasks !== "object") return { v: 1, tasks: {} };
    return data;
  } catch {
    return { v: 1, tasks: {} };
  }
}

function saveStore(data: PersistShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota / private mode
  }
}

export function subtaskStorageKey(
  section: "user" | "employer",
  taskId: number
): string {
  return `${section}:${taskId}`;
}

/**
 * Stable key for subtask checkboxes. Prefer section+id from the active task;
 * else infer from roadmap; else title (legacy / handoff without section).
 */
export function resolveSubtaskProgressKey(
  roadmap: {
    userTasks: { id: number }[];
    employerTasks: { id: number }[];
  } | null,
  roadmapTaskId: number | undefined,
  taskTitle: string,
  taskSection?: "user" | "employer"
): string {
  if (roadmapTaskId != null && taskSection) {
    return subtaskStorageKey(taskSection, roadmapTaskId);
  }
  if (roadmap && roadmapTaskId != null) {
    if (roadmap.userTasks.some((t) => t.id === roadmapTaskId)) {
      return subtaskStorageKey("user", roadmapTaskId);
    }
    if (roadmap.employerTasks.some((t) => t.id === roadmapTaskId)) {
      return subtaskStorageKey("employer", roadmapTaskId);
    }
  }
  return `title:${taskTitle.toLowerCase().trim()}`;
}

/** Read progress for subtask indices; only indices < subtaskCount are meaningful to caller. */
export function readSubtaskProgress(storageKey: string): Record<number, boolean> {
  const data = loadStore();
  const entry = data.tasks[storageKey];
  if (!entry) return {};
  const out: Record<number, boolean> = {};
  for (const [k, v] of Object.entries(entry)) {
    const i = Number(k);
    if (!Number.isNaN(i) && v) out[i] = true;
  }
  return out;
}

/** Clamp stored map to current subtask list length (drops stale indices). */
export function clampSubtaskProgress(
  raw: Record<number, boolean>,
  subtaskCount: number
): Record<number, boolean> {
  const next: Record<number, boolean> = {};
  for (let i = 0; i < subtaskCount; i++) {
    if (raw[i]) next[i] = true;
  }
  return next;
}

export function writeSubtaskChecked(
  storageKey: string,
  index: number,
  done: boolean,
  subtaskCount: number
): void {
  const data = loadStore();
  if (!data.tasks[storageKey]) data.tasks[storageKey] = {};

  const row = { ...data.tasks[storageKey] };
  if (done) {
    row[String(index)] = true;
  } else {
    delete row[String(index)];
  }
  data.tasks[storageKey] = row;

  // Prune indices out of range
  const pruned: Record<string, boolean> = {};
  for (let i = 0; i < subtaskCount; i++) {
    if (row[String(i)]) pruned[String(i)] = true;
  }
  data.tasks[storageKey] = pruned;

  saveStore(data);
}
