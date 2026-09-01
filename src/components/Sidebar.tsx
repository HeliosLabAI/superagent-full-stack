import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  BookOpen,
  Clock,
  Folder,
  FolderPlus,
  LayoutGrid,
  type LucideIcon,
  MessagesSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Search,
  SquareDashed,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createProject,
  deleteProject,
  deleteTask,
  patchTask,
  relativeTime,
  togglePin,
  useStore,
  type Task,
} from "@/lib/store";

const nav = [
  { label: "New task", icon: Wand2, to: "/" },
  { label: "Agent", icon: SquareDashed, to: "/agent" },
  { label: "Plugins", icon: LayoutGrid, to: "/plugins" },
  { label: "Scheduled", icon: Clock, to: "/scheduled" },
  { label: "Library", icon: BookOpen, to: "/library" },
] as const;


function TaskRow({ task, active }: { task: Task; active: boolean }) {
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(task.title);

  if (renaming) {
    return (
      <form
        className="px-2 py-1"
        onSubmit={(e) => {
          e.preventDefault();
          patchTask(task.id, { title: draft.trim() || task.title });
          setRenaming(false);
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setRenaming(false)}
          className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-ring/40"
        />
      </form>
    );
  }

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg pr-1 transition-colors ${
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
      }`}
    >
      <button
        type="button"
        onClick={() => navigate({ to: "/task/$taskId", params: { taskId: task.id } })}
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left text-[15px] text-sidebar-foreground"
      >
        {task.pinned ? (
          <Pin className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
        ) : (
          <MessagesSquare className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
        )}
        <span className="min-w-0 flex-1 truncate">{task.title}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Task options"
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setRenaming(true)}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => togglePin(task.id)}>
            {task.pinned ? (
              <>
                <PinOff className="size-4" /> Unpin
              </>
            ) : (
              <>
                <Pin className="size-4" /> Pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              deleteTask(task.id);
              toast.success("Task deleted");
              if (active) navigate({ to: "/" });
            }}
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Sidebar({
  activeId,
  onSearch,
}: {
  activeId?: string;
  onSearch: () => void;
}) {
  const tasks = useStore((s) => s.tasks);
  const projects = useStore((s) => s.projects);
  const credits = useStore((s) => s.credits);
  const [newProject, setNewProject] = useState(false);

  const sorted = [...tasks].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
    return b.updatedAt - a.updatedAt;
  });

  const linkCls =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent";

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <nav className="px-3 pt-4">
        {nav.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className={linkCls}
            activeProps={{ className: `${linkCls} bg-sidebar-accent font-medium` }}
            activeOptions={{ exact: to === "/" }}
          >
            <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
            {label}
          </Link>
        ))}
        <button type="button" onClick={onSearch} className={`${linkCls} justify-between`}>
          <span className="flex items-center gap-3">
            <Search className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
            Search
          </span>
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </nav>

      <div className="mt-6 px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[13px] font-medium text-muted-foreground">Projects</span>
          <button
            type="button"
            onClick={() => setNewProject(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
            aria-label="New project"
          >
            <FolderPlus className="size-4" />
          </button>
        </div>
        {projects.map((p) => (
          <div key={p.id} className="group flex items-center gap-2 rounded-lg pr-1 hover:bg-sidebar-accent">
            <span className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-[15px] text-sidebar-foreground">
              <Folder className="size-[16px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-[12px] text-muted-foreground">
                {tasks.filter((t) => t.projectId === p.id).length}
              </span>
            </span>
            <button
              type="button"
              aria-label="Delete project"
              onClick={() => {
                deleteProject(p.id);
                toast.success("Project removed");
              }}
              className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {newProject && (
          <form
            className="px-2 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              createProject(String(data.get("name") ?? ""));
              setNewProject(false);
              toast.success("Project created");
            }}
          >
            <input
              autoFocus
              name="name"
              placeholder="Project name"
              onBlur={() => setNewProject(false)}
              className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-[14px] outline-none focus:ring-2 focus:ring-ring/40"
            />
          </form>
        )}
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[13px] font-medium text-muted-foreground">Tasks</span>
          <span className="text-[12px] text-muted-foreground">{tasks.length}</span>
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-4">
          {sorted.length === 0 ? (
            <p className="px-3 py-2 text-[14px] text-muted-foreground">
              No tasks yet. Assign one to get started.
            </p>
          ) : (
            sorted.map((task) => (
              <TaskRow key={task.id} task={task} active={task.id === activeId} />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            S
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-medium text-sidebar-foreground">Sameer</p>
            <p className="text-[12px] text-muted-foreground">{credits} credits</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() =>
              toast(
                tasks.length
                  ? `Latest activity ${relativeTime(sorted[0].updatedAt)}`
                  : "No activity yet",
              )
            }
            className="rounded-md p-1 hover:bg-sidebar-accent"
          >
            <Bell className="size-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </aside>
  );
}
