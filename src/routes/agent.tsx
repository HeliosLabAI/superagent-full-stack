import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, Folder, MessagesSquare, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MODELS, modelName, relativeTime, useStore } from "@/lib/store";

export const Route = createFileRoute("/agent")({
  head: () => ({
    meta: [
      { title: "Agent — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content:
          "See how the SuperIntelligence agent works: available models, active capabilities and the workspace activity across your tasks.",
      },
      { property: "og:title", content: "Agent — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Models, capabilities and workspace activity for your agent.",
      },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  const tasks = useStore((s) => s.tasks);
  const plugins = useStore((s) => s.plugins);
  const navigate = useNavigate();

  const fileCount = tasks.reduce((n, t) => n + Object.keys(t.files ?? {}).length, 0);
  const messageCount = tasks.reduce((n, t) => n + t.messages.length, 0);
  const enabled = Object.entries(plugins).filter(([, v]) => v).length;

  const stats = [
    { label: "Tasks", value: tasks.length, icon: MessagesSquare },
    { label: "Messages", value: messageCount, icon: Sparkles },
    { label: "Workspace files", value: fileCount, icon: FileText },
    { label: "Capabilities on", value: enabled, icon: Folder },
  ];

  const recent = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);

  return (
    <AppShell title="Agent" subtitle="Models, capabilities and activity">
      <div className="mx-auto w-full max-w-[880px] px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
              <p className="mt-3 text-[24px] font-semibold text-foreground">{value}</p>
              <p className="text-[13px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-[15px] font-medium text-foreground">Models</h2>
        <div className="mt-3 space-y-2">
          {MODELS.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4"
            >
              <div>
                <p className="text-[15px] text-foreground">{m.name}</p>
                <p className="text-[13px] text-muted-foreground">{m.blurb}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-[12px] text-muted-foreground">
                available
              </span>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-[15px] font-medium text-foreground">Recent activity</h2>
        <div className="mt-3 space-y-2">
          {recent.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">No tasks yet.</p>
          ) : (
            recent.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate({ to: "/task/$taskId", params: { taskId: t.id } })}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-accent"
              >
                <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">
                  {t.title}
                </span>
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {modelName(t.model)} · {relativeTime(t.updatedAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
