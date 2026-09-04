import { createFileRoute } from "@tanstack/react-router";
import { FileText, Globe, LineChart, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { togglePlugin, useStore, type PluginId } from "@/lib/store";

export const Route = createFileRoute("/plugins")({
  head: () => ({
    meta: [
      { title: "Plugins — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content:
          "Enable or disable the capabilities the SuperIntelligence agent can use: web research, planning, files and charts.",
      },
      { property: "og:title", content: "Plugins — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Control which agent capabilities are available in your tasks.",
      },
    ],
  }),
  component: PluginsPage,
});

const plugins: { id: PluginId; name: string; blurb: string; icon: typeof Globe }[] = [
  {
    id: "web_research",
    name: "Web research",
    blurb: "Let the agent look up current public information while it works.",
    icon: Globe,
  },
  {
    id: "plan",
    name: "Planning",
    blurb: "The agent publishes a step-by-step plan before starting long tasks.",
    icon: ListChecks,
  },
  {
    id: "files",
    name: "File workspace",
    blurb: "Read, write and edit real files that persist with every task.",
    icon: FileText,
  },
  {
    id: "charts",
    name: "Charts",
    blurb: "Generate chart definitions and data tables inside answers.",
    icon: LineChart,
  },
];

function PluginsPage() {
  const state = useStore((s) => s.plugins);

  return (
    <AppShell title="Plugins" subtitle="Capabilities available to the agent">
      <div className="mx-auto w-full max-w-[820px] px-6 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {plugins.map(({ id, name, blurb, icon: Icon }) => {
            const on = state[id];
            return (
              <div key={id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary">
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.6} />
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={`Toggle ${name}`}
                    onClick={() => {
                      togglePlugin(id);
                      toast.success(`${name} ${on ? "disabled" : "enabled"}`);
                    }}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      on ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`block size-5 rounded-full bg-card transition-transform ${
                        on ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <h2 className="mt-4 text-[16px] font-medium text-foreground">{name}</h2>
                <p className="mt-1 text-[14px] text-muted-foreground">{blurb}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
