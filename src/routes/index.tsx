import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, FileText, Laptop, Palette, Presentation, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AgentComposer } from "@/components/AgentComposer";
import { createTask, relativeTime, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuperIntelligence Agent Platform — What can I do for you?" },
      {
        name: "description",
        content:
          "Assign a task to the SuperIntelligence agent: research, slides, websites, code and design work, handled end to end with a real file workspace.",
      },
      { property: "og:title", content: "SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Assign a task and watch the agent plan, research, write files and report back.",
      },
    ],
  }),
  component: Home,
});

const quickActions = [
  { label: "Create slides", prompt: "Create an outline and slide deck content for a topic I choose next.", icon: Presentation },
  { label: "Build website", prompt: "Build a small static website in the workspace: index.html, styles.css and a short README.", icon: Code2 },
  { label: "Research a topic", prompt: "Research a topic for me and produce a briefing with sources and open questions.", icon: Search },
  { label: "Write a script", prompt: "Write a Python script in the workspace that automates a task I describe next.", icon: Laptop },
  { label: "Design system", prompt: "Draft a design system: colour tokens, type scale and component rules. Save it as design.md.", icon: Palette },
];

function Home() {
  const navigate = useNavigate();
  const tasks = useStore((s) => s.tasks);
  const [model, setModel] = useState("superintelligence-1.0");

  const start = (prompt: string) => {
    const task = createTask({ prompt, model });
    navigate({ to: "/task/$taskId", params: { taskId: task.id } });
  };


  const recent = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  return (
    <AppShell title="SuperIntelligence 1.0" subtitle="Autonomous agent workspace">
      <div className="mx-auto flex w-full max-w-[820px] flex-col items-center px-6 pb-16 pt-[9vh]">
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-[14px] text-muted-foreground">
          Free plan
          <span className="text-border">|</span>
          <span className="font-medium text-link">Real tools · real files</span>
        </div>

        <h1 className="serif-display mt-8 text-center text-5xl text-foreground md:text-[56px]">
          What can I do for you?
        </h1>

        <div className="mt-10 w-full">
          <AgentComposer
            model={model}
            onModelChange={setModel}
            onSubmit={({ text, research }) => start(text, research)}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => start(prompt, true)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-accent"
            >
              <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
              {label}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-14 w-full">
            <h2 className="px-1 text-[13px] font-medium text-muted-foreground">Continue</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recent.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() =>
                    navigate({ to: "/task/$taskId", params: { taskId: task.id } })
                  }
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-foreground">{task.title}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {task.messages.length} messages · {relativeTime(task.updatedAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
