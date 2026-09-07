import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Presentation, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AgentComposer } from "@/components/AgentComposer";
import { createTask } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SuperIntelligence Agent Platform — What can I do for you?" },
      {
        name: "description",
        content:
          "Assign a task to the SuperIntelligence agent: research, writing and code, handled end to end with a real file workspace.",
      },
      { property: "og:title", content: "SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Assign a task and watch the agent research, write files and report back.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const quickActions = [
  {
    label: "Research a topic",
    prompt: "Research a topic for me and produce a briefing with sources and open questions.",
    icon: Search,
  },
  {
    label: "Build website",
    prompt: "Build a small static website in the workspace: index.html and styles.css.",
    icon: Code2,
  },
  {
    label: "Create slides",
    prompt: "Create an outline and slide deck content for a topic I choose next.",
    icon: Presentation,
  },
];

function Home() {
  const navigate = useNavigate();
  const [model, setModel] = useState("superintelligence-1.0");

  const start = (prompt: string) => {
    const task = createTask({ prompt, model });
    navigate({ to: "/task/$taskId", params: { taskId: task.id } });
  };

  return (
    <AppShell title="SuperIntelligence 1.0">
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-6 pb-16 pt-[12vh]">
        <h1 className="serif-display text-center text-5xl text-foreground md:text-[56px]">
          What can I do for you?
        </h1>

        <div className="mt-10 w-full">
          <AgentComposer model={model} onModelChange={setModel} onSubmit={({ text }) => start(text)} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => start(prompt)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-accent"
            >
              <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

