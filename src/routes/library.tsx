import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { deleteLibraryItem, relativeTime, useStore } from "@/lib/store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content:
          "Every answer and document you saved from an agent task, ready to copy, revisit or delete.",
      },
      { property: "og:title", content: "Library — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Saved agent answers and documents in one place.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const library = useStore((s) => s.library);

  return (
    <AppShell title="Library" subtitle="Saved answers and documents">
      <div className="mx-auto w-full max-w-[820px] px-6 py-8">
        {library.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <BookOpen className="mx-auto size-5 text-muted-foreground" />
            <p className="mt-3 text-[15px] text-muted-foreground">
              Nothing saved yet. Use “Save to library” on any agent answer.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {library.map((item) => (
              <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-medium text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      saved {relativeTime(item.createdAt)} ·{" "}
                      <Link
                        to="/task/$taskId"
                        params={{ taskId: item.taskId }}
                        className="text-link"
                      >
                        open task
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Copy"
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(item.content)
                          .then(() => toast.success("Copied"));
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                    >
                      <Copy className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => {
                        deleteLibraryItem(item.id);
                        toast.success("Removed from library");
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground">
                  {item.content.slice(0, 1200)}
                  {item.content.length > 1200 ? "…" : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
