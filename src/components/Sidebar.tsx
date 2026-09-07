import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { MessagesSquare, Plus, Search, Trash2 } from "lucide-react";
import { deleteTask, useStore } from "@/lib/store";

/** Flat row with a left accent bar on the active item. */
function Row({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`relative flex h-10 items-center gap-3 rounded-[4px] px-3 text-[14px] text-sidebar-foreground transition-colors ${
        active ? "bg-sidebar-accent font-medium" : "hover:bg-sidebar-accent"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-active" />
      )}
      {children}
    </span>
  );
}

export function Sidebar({
  activeId,
  onSearch,
}: {
  activeId?: string | undefined;
  onSearch: () => void;
}) {
  const tasks = useStore((s) => s.tasks);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sorted = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <nav className="space-y-0.5 px-3 pt-4">
        <Link to="/" className="block">
          <Row active={pathname === "/"}>
            <Plus className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            New task
          </Row>
        </Link>
        <button type="button" onClick={onSearch} className="block w-full text-left">
          <Row>
            <Search className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            Search
            <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
              ⌘K
            </kbd>
          </Row>
        </button>
      </nav>

      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <span className="px-3 pb-1 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
          Tasks
        </span>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-4">
          {sorted.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-muted-foreground">No tasks yet.</p>
          ) : (
            sorted.map((task) => (
              <div key={task.id} className="group relative flex items-center">
                <button
                  type="button"
                  title={task.title}
                  onClick={() => navigate({ to: "/task/$taskId", params: { taskId: task.id } })}
                  className="min-w-0 flex-1 text-left"
                >
                  <Row active={task.id === activeId}>
                    <MessagesSquare
                      className="size-[17px] shrink-0 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="min-w-0 flex-1 truncate pr-5">{task.title}</span>
                  </Row>
                </button>
                <button
                  type="button"
                  aria-label="Delete task"
                  onClick={() => {
                    deleteTask(task.id);
                    if (task.id === activeId) navigate({ to: "/" });
                  }}
                  className="absolute right-1 rounded-[4px] p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
