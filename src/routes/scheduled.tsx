import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  addJob,
  createTask,
  deleteJob,
  patchJob,
  relativeTime,
  useStore,
  type ScheduledJob,
} from "@/lib/store";

export const Route = createFileRoute("/scheduled")({
  head: () => ({
    meta: [
      { title: "Scheduled runs — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content:
          "Create recurring agent runs: save a prompt with an hourly, daily or weekly cadence and launch it whenever you want.",
      },
      { property: "og:title", content: "Scheduled runs — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Save recurring prompts and run them on demand.",
      },
    ],
  }),
  component: ScheduledPage,
});

const cadences: ScheduledJob["cadence"][] = ["hourly", "daily", "weekly"];

function ScheduledPage() {
  const jobs = useStore((s) => s.jobs);
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [cadence, setCadence] = useState<ScheduledJob["cadence"]>("daily");

  return (
    <AppShell title="Scheduled" subtitle="Recurring prompts for the agent">
      <div className="mx-auto w-full max-w-[760px] px-6 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!prompt.trim()) return;
            addJob(prompt.trim(), cadence);
            setPrompt("");
            toast.success("Schedule created");
          }}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="What should the agent do on every run?"
            className="w-full resize-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {cadences.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCadence(c)}
                  className={`rounded-full px-3 py-1.5 text-[13px] capitalize transition-colors ${
                    cadence === c
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground disabled:opacity-50"
              disabled={!prompt.trim()}
            >
              Add schedule
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-2">
          {jobs.length === 0 ? (
            <p className="px-1 text-[14px] text-muted-foreground">
              No schedules yet. Save a prompt above to reuse it.
            </p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-foreground">{job.prompt}</p>
                  <p className="mt-1 text-[12px] capitalize text-muted-foreground">
                    {job.cadence} · created {relativeTime(job.createdAt)}
                    {job.lastRunAt ? ` · last run ${relativeTime(job.lastRunAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Run now"
                    onClick={() => {
                      patchJob(job.id, { lastRunAt: Date.now() });
                      const task = createTask({ prompt: job.prompt });
                      navigate({ to: "/task/$taskId", params: { taskId: task.id } });
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Play className="size-4" />
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={job.enabled}
                    aria-label="Toggle schedule"
                    onClick={() => patchJob(job.id, { enabled: !job.enabled })}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                      job.enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`block size-5 rounded-full bg-card transition-transform ${
                        job.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete schedule"
                    onClick={() => {
                      deleteJob(job.id);
                      toast.success("Schedule removed");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
