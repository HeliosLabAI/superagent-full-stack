import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export type Task = {
  id: string;
  title: string;
  icon: string;
  updatedAt: number;
  createdAt: number;
  projectId?: string | undefined;
  pinned?: boolean | undefined;
  files?: Record<string, string> | undefined;
  model: string;
  messages: UIMessage[];
  /** Prompt typed on the launcher that the task page should auto-send once. */
  pendingPrompt?: string | undefined;
};

export type Project = { id: string; name: string; createdAt: number };

export type ScheduledJob = {
  id: string;
  prompt: string;
  cadence: "hourly" | "daily" | "weekly";
  enabled: boolean;
  createdAt: number;
  lastRunAt?: number;
};

export type LibraryItem = {
  id: string;
  taskId: string;
  title: string;
  content: string;
  createdAt: number;
};

export type PluginId = "web_research" | "plan" | "files" | "charts";

export type State = {
  tasks: Task[];
  projects: Project[];
  jobs: ScheduledJob[];
  library: LibraryItem[];
  plugins: Record<PluginId, boolean>;
  credits: number;
};

const KEY = "sia.state.v2";

const initial: State = {
  tasks: [],
  projects: [{ id: "default", name: "Personal", createdAt: Date.now() }],
  jobs: [],
  library: [],
  plugins: { web_research: true, plan: true, files: false, charts: false },
  credits: 300,
};

let state: State = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<State>;
    return { ...initial, ...parsed, plugins: { ...initial.plugins, ...parsed.plugins } };
  } catch {
    return initial;
  }
}

function emit() {
  for (const l of listeners) l();
}

function write(next: State) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
  }
  emit();
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = read();
  emit();
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = read();
      emit();
    }
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

export function getState() {
  return state;
}

export function update(fn: (s: State) => State) {
  write(fn(state));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function titleFrom(prompt: string) {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "New task";
}

export function createTask(input: {
  prompt?: string;
  model?: string;
  projectId?: string;
  title?: string;
}): Task {
  const now = Date.now();
  const task: Task = {
    id: newId(),
    title: input.title ?? titleFrom(input.prompt ?? ""),
    icon: "sparkle",
    createdAt: now,
    updatedAt: now,
    model: input.model ?? "superintelligence-1.0",
    projectId: input.projectId,
    messages: [],
    pendingPrompt: input.prompt,
  };
  update((s) => ({ ...s, tasks: [task, ...s.tasks] }));
  return task;
}

export function patchTask(id: string, patch: Partial<Task>) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
  }));
}

export function setTaskMessages(id: string, messages: UIMessage[]) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, messages, updatedAt: Date.now() } : t)),
  }));
}

export function deleteTask(id: string) {
  update((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => t.id !== id),
    library: s.library.filter((l) => l.taskId !== id),
  }));
}

export function togglePin(id: string) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
  }));
}

export function createProject(name: string) {
  const project: Project = { id: newId(), name: name.trim() || "Untitled project", createdAt: Date.now() };
  update((s) => ({ ...s, projects: [...s.projects, project] }));
  return project;
}

export function deleteProject(id: string) {
  update((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== id),
    tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
  }));
}

export function addJob(prompt: string, cadence: ScheduledJob["cadence"]) {
  const job: ScheduledJob = {
    id: newId(),
    prompt,
    cadence,
    enabled: true,
    createdAt: Date.now(),
  };
  update((s) => ({ ...s, jobs: [job, ...s.jobs] }));
  return job;
}

export function patchJob(id: string, patch: Partial<ScheduledJob>) {
  update((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
}

export function deleteJob(id: string) {
  update((s) => ({ ...s, jobs: s.jobs.filter((j) => j.id !== id) }));
}

export function saveToLibrary(item: Omit<LibraryItem, "id" | "createdAt">) {
  const entry: LibraryItem = { ...item, id: newId(), createdAt: Date.now() };
  update((s) => ({ ...s, library: [entry, ...s.library] }));
  return entry;
}

export function deleteLibraryItem(id: string) {
  update((s) => ({ ...s, library: s.library.filter((l) => l.id !== id) }));
}

export function togglePlugin(id: PluginId) {
  update((s) => ({ ...s, plugins: { ...s.plugins, [id]: !s.plugins[id] } }));
}

export function spendCredit(n = 1) {
  update((s) => ({ ...s, credits: Math.max(0, s.credits - n) }));
}

export function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? "yesterday" : `${day}d ago`;
}

export const MODELS = [
  {
    id: "superintelligence-1.0",
    name: "SuperIntelligence 1.0",
    blurb: "Balanced speed and depth for everyday tasks",
  },
  {
    id: "superintelligence-1.0-pro",
    name: "SuperIntelligence 1.0 Pro",
    blurb: "Deepest reasoning for complex research",
  },
  {
    id: "superintelligence-lite",
    name: "SuperIntelligence Lite",
    blurb: "Fastest responses for quick questions",
  },
] as const;

export function modelName(id: string) {
  return MODELS.find((m) => m.id === id)?.name ?? MODELS[0].name;
}
