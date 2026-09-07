import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

export type Task = {
  id: string;
  title: string;
  updatedAt: number;
  createdAt: number;
  files?: Record<string, string> | undefined;
  model: string;
  messages: UIMessage[];
  /** Prompt typed on the launcher that the task page should auto-send once. */
  pendingPrompt?: string | undefined;
};

export type State = { tasks: Task[] };

const KEY = "sia.state.v2";

const initial: State = { tasks: [] };

let state: State = initial;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): State {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...(JSON.parse(raw) as Partial<State>) };
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

export function createTask(input: { prompt?: string; model?: string; title?: string }): Task {
  const now = Date.now();
  const task: Task = {
    id: newId(),
    title: input.title ?? titleFrom(input.prompt ?? ""),
    createdAt: now,
    updatedAt: now,
    model: input.model ?? "superintelligence-1.0",
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
  patchTask(id, { messages });
}

export function deleteTask(id: string) {
  update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
}

export function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function relativeTime(ts: number): string {
  const min = Math.round((Date.now() - ts) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return day === 1 ? "yesterday" : `${day}d ago`;
}

export const MODELS = [
  { id: "superintelligence-1.0", name: "SuperIntelligence 1.0" },
  { id: "superintelligence-1.0-pro", name: "SuperIntelligence 1.0 Pro" },
  { id: "superintelligence-lite", name: "SuperIntelligence Lite" },
] as const;

export function modelName(id: string) {
  return MODELS.find((m) => m.id === id)?.name ?? MODELS[0].name;
}
