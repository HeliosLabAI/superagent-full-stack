import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, FileText, RefreshCw, Share2, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Composer } from "@/components/Composer";
import { loadTasks, newId, saveTasks, simulateAgent, type Task } from "@/lib/tasks";

export const Route = createFileRoute("/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content: "Follow the agent's plan, steps and findings for this task.",
      },
      { property: "og:title", content: "Task — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Follow the agent's plan, steps and findings for this task.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TaskPage,
});

function TaskPage() {
  const { taskId } = useParams({ from: "/task/$taskId" });
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const task = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const send = (prompt: string) => {
    if (!task) return;
    const updated: Task = {
      ...task,
      updatedAt: Date.now(),
      messages: [
        ...task.messages,
        { id: newId(), role: "user", text: prompt },
        ...simulateAgent(prompt),
      ],
    };
    const next = [updated, ...tasks.filter((t) => t.id !== task.id)];
    setTasks(next);
    saveTasks(next);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar tasks={tasks} activeId={taskId} />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[17px] font-semibold text-foreground"
          >
            SuperIntelligence 1.0
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[14px] font-medium text-accent-foreground"
            >
              <Sparkles className="size-4" />
              Upgrade
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[14px] text-foreground hover:bg-accent"
            >
              <Share2 className="size-4" />
              Share
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-6 pb-40">
            {!task ? (
              <div className="pt-24 text-center">
                <p className="text-[15px] text-muted-foreground">
                  This task isn&apos;t available in this browser.
                </p>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/" })}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground"
                >
                  Start a new task
                </button>
              </div>
            ) : task.messages.length === 0 ? (
              <div className="pt-24 text-center">
                <h1 className="serif-display text-4xl text-foreground">{task.title}</h1>
                <p className="mt-3 text-[15px] text-muted-foreground">
                  Send a message to pick this task back up.
                </p>
              </div>
            ) : (
              <div className="space-y-8 pt-4">
                {task.messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-card px-5 py-3.5 text-[15px] leading-relaxed text-card-foreground shadow-composer">
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id}>
                      <div className="flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          S
                        </span>
                        <span className="text-[15px] font-semibold text-foreground">
                          superintelligence
                        </span>
                        <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          Agent
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] leading-7 text-foreground">{m.text}</p>
                      {m.steps && (
                        <ul className="mt-3 space-y-1.5">
                          {m.steps.map((s) => (
                            <li
                              key={s.label}
                              className="flex items-center gap-2 text-[14px] text-muted-foreground"
                            >
                              <Check className="size-4 rounded-full bg-secondary p-0.5" />
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                        <button
                          type="button"
                          aria-label="Copy"
                          className="rounded-md p-1 hover:bg-accent"
                        >
                          <Copy className="size-4" strokeWidth={1.6} />
                        </button>
                        <button
                          type="button"
                          aria-label="Retry"
                          className="rounded-md p-1 hover:bg-accent"
                        >
                          <RefreshCw className="size-4" strokeWidth={1.6} />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-6 pb-6">
          <div className="mx-auto w-full max-w-[760px]">
            {task && task.messages.length > 0 && (
              <div className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 text-[14px]">
                <FileText className="size-4 text-muted-foreground" strokeWidth={1.6} />
                <Check className="size-4 text-foreground" />
                <span className="flex-1 truncate text-foreground">
                  Report findings and recommendations to user
                </span>
                <span className="text-muted-foreground">3 / 3</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            )}
            <Composer
              placeholder="Message SuperIntelligence"
              onSubmit={send}
              autoFocus={Boolean(task)}
            />
            <p className="mt-2 text-center text-[12px] text-muted-foreground">
              SuperIntelligence is an AI agent and can make mistakes. Please double-check before
              use.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
