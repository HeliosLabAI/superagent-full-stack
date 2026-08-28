export type Step = { label: string; done: boolean };

export type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  steps?: Step[];
};

export type Task = {
  id: string;
  title: string;
  icon: string;
  updatedAt: number;
  messages: Message[];
};

const KEY = "sia.tasks.v1";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) && parsed.length ? parsed : seed();
  } catch {
    return seed();
  }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(tasks));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function titleFrom(prompt: string) {
  const t = prompt.trim().replace(/\s+/g, " ");
  return t.length > 42 ? `${t.slice(0, 42)}…` : t || "New task";
}

function seed(): Task[] {
  const base = Date.now();
  const items: Array<[string, string]> = [
    ["Greeting Message", "sparkle"],
    ["Identifying Issues in Agent Sum Fold…", "doc"],
    ["Stock Analysis XAUSUD", "chart"],
    ["Exploring Channel and Suggestions", "video"],
    ["Sales Tracking Dashboard Design", "grid"],
    ["Easy-to-Use Retirement Planning Tool", "spark"],
  ];
  const tasks = items.map(([title, icon], i) => ({
    id: newId(),
    title,
    icon,
    updatedAt: base - i * 3_600_000,
    messages: [] as Message[],
  }));
  saveTasks(tasks);
  return tasks;
}

/** Deterministic, front-end only simulation of the agent's reasoning trace. */
export function simulateAgent(prompt: string): Message[] {
  const subject = prompt.trim().replace(/\.$/, "");
  return [
    {
      id: newId(),
      role: "agent",
      text: `I'll work on "${subject}" and report back with a clear summary and recommendations.`,
      steps: [{ label: "Plan the approach and gather sources", done: true }],
    },
    {
      id: newId(),
      role: "agent",
      text: "Collecting context now. If a source is unavailable I'll switch to an alternative method rather than stopping.",
      steps: [
        { label: "Plan the approach and gather sources", done: true },
        { label: "Collect and cross-check information", done: true },
      ],
    },
    {
      id: newId(),
      role: "agent",
      text: `Here is what stands out for ${subject}: the strongest signals point to three priorities worth acting on first, and I've ranked them by impact and effort so you can start immediately.`,
      steps: [
        { label: "Plan the approach and gather sources", done: true },
        { label: "Collect and cross-check information", done: true },
        { label: "Report findings and recommendations", done: true },
      ],
    },
  ];
}
