import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Code2, Laptop, Palette, Presentation, Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Composer } from "@/components/Composer";
import {
  loadTasks,
  newId,
  saveTasks,
  simulateAgent,
  titleFrom,
  type Task,
} from "@/lib/tasks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuperIntelligence Agent Platform — What can I do for you?" },
      {
        name: "description",
        content:
          "Assign a task to the SuperIntelligence agent: research, slides, websites, desktop apps and design work, handled end to end.",
      },
      { property: "og:title", content: "SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Assign a task and watch the agent plan, research and report back.",
      },
    ],
  }),
  component: Home,
});

const quickActions = [
  { label: "Create slides", icon: Presentation },
  { label: "Build website", icon: Code2 },
  { label: "Develop desktop apps", icon: Laptop },
  { label: "Design", icon: Palette },
];

function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const start = (prompt: string) => {
    const task: Task = {
      id: newId(),
      title: titleFrom(prompt),
      icon: "sparkle",
      updatedAt: Date.now(),
      messages: [
        { id: newId(), role: "user", text: prompt },
        ...simulateAgent(prompt),
      ],
    };
    const next = [task, ...tasks];
    setTasks(next);
    saveTasks(next);
    navigate({ to: "/task/$taskId", params: { taskId: task.id } });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar tasks={tasks} />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[17px] font-semibold text-foreground"
          >
            SuperIntelligence 1.0
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[14px] font-medium">
            <Sparkles className="size-4 text-muted-foreground" />
            300
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center px-6 pt-[12vh]">
          <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-[14px] text-muted-foreground">
            Free plan
            <span className="text-border">|</span>
            <button type="button" className="font-medium text-link">
              Upgrade
            </button>
          </div>

          <h1 className="serif-display mt-8 text-center text-5xl text-foreground md:text-[56px]">
            What can I do for you?
          </h1>

          <div className="mt-10 w-full">
            <Composer onSubmit={start} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {quickActions.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => start(label)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-accent"
              >
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
                {label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full border border-border bg-card px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-accent"
            >
              More
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
