import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Clock,
  Folder,
  FolderPlus,
  LayoutGrid,
  Menu,
  MessagesSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Search,
  Settings,
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

/** Flat Windows-Settings style row: left accent bar on the active item. */
function Row({
  active,
  collapsed,
  children,
}: {
  active?: boolean;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`relative flex h-10 items-center gap-3 rounded-[4px] ${
        collapsed ? "justify-center px-0" : "px-3"
      } text-[14px] text-sidebar-foreground transition-colors ${
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

function TaskRow({
  task,
  active,
  collapsed,
}: {
  task: Task;
  active: boolean;
  collapsed: boolean;
}) {
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
          className="w-full rounded-[4px] border border-border bg-card px-2 py-1.5 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-ring/40"
        />
      </form>
    );
  }

  return (
    <div className="group relative flex items-center">
      <button
        type="button"
        title={task.title}
        onClick={() => navigate({ to: "/task/$taskId", params: { taskId: task.id } })}
        className="min-w-0 flex-1 text-left"
      >
        <Row active={active} collapsed={collapsed}>
          {task.pinned ? (
            <Pin className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <MessagesSquare
              className="size-[17px] shrink-0 text-muted-foreground"
              strokeWidth={1.5}
            />
          )}
          {!collapsed && <span className="min-w-0 flex-1 truncate">{task.title}</span>}
        </Row>
      </button>
      {!collapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Task options"
              className="absolute right-1 rounded-[4px] p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 data-[state=open]:opacity-100"
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
              className="text-destructive focus:text-destructive"
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
      )}
    </div>
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
  const projects = useStore((s) => s.projects);
  const credits = useStore((s) => s.credits);
  const [newProject, setNewProject] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sorted = [...tasks].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
    return b.updatedAt - a.updatedAt;
  });
  const latest = sorted[0];

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex ${
        collapsed ? "w-[60px]" : "w-[300px]"
      }`}
    >
      <div className={`flex items-center gap-1 pt-3 ${collapsed ? "flex-col px-2" : "px-3"}`}>
        <button
          type="button"
          aria-label="Go back"
          onClick={() => window.history.back()}
          className="rounded-[4px] p-2 text-muted-foreground hover:bg-sidebar-accent"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={1.6} />
        </button>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-[4px] p-2 text-muted-foreground hover:bg-sidebar-accent"
        >
          <Menu className="size-[18px]" strokeWidth={1.6} />
        </button>
      </div>

      <nav className={`mt-2 ${collapsed ? "px-2" : "px-3"} space-y-0.5`}>
        {nav.map(({ label, icon: Icon, to }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link key={label} to={to} title={label} className="block">
              <Row active={active} collapsed={collapsed}>
                <Icon className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
                {!collapsed && label}
              </Row>
            </Link>
          );
        })}
        <button type="button" onClick={onSearch} title="Search" className="block w-full text-left">
          <Row collapsed={collapsed}>
            <Search className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            {!collapsed && (
              <>
                Search
                <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </Row>
        </button>
      </nav>

      {!collapsed && (
        <div className="mt-6 px-3">
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Projects
            </span>
            <button
              type="button"
              onClick={() => setNewProject(true)}
              className="rounded-[4px] p-1 text-muted-foreground hover:bg-sidebar-accent"
              aria-label="New project"
            >
              <FolderPlus className="size-4" />
            </button>
          </div>
          {projects.map((p) => (
            <div key={p.id} className="group relative flex items-center">
              <span className="min-w-0 flex-1">
                <Row collapsed={false}>
                  <Folder className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto pr-6 text-[12px] text-muted-foreground">
                    {tasks.filter((t) => t.projectId === p.id).length}
                  </span>
                </Row>
              </span>
              <button
                type="button"
                aria-label="Delete project"
                onClick={() => {
                  deleteProject(p.id);
                  toast.success("Project removed");
                }}
                className="absolute right-1 rounded-[4px] p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
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
                className="w-full rounded-[4px] border border-border bg-card px-2 py-1.5 text-[14px] outline-none focus:ring-2 focus:ring-ring/40"
              />
            </form>
          )}
        </div>
      )}

      <div className={`mt-6 flex min-h-0 flex-1 flex-col ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
              Tasks
            </span>
            <span className="text-[12px] text-muted-foreground">{tasks.length}</span>
          </div>
        )}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-4">
          {sorted.length === 0
            ? !collapsed && (
                <p className="px-3 py-2 text-[13px] text-muted-foreground">
                  No tasks yet. Assign one to get started.
                </p>
              )
            : sorted.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  active={task.id === activeId}
                  collapsed={collapsed}
                />
              ))}
        </div>
      </div>

      <div className={`border-t border-sidebar-border py-2 ${collapsed ? "px-2" : "px-3"}`}>
        <button
          type="button"
          title="Notifications"
          onClick={() =>
            toast(latest ? `Latest activity ${relativeTime(latest.updatedAt)}` : "No activity yet")
          }
          className="block w-full text-left"
        >
          <Row collapsed={collapsed}>
            <Bell className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            {!collapsed && "Notifications"}
          </Row>
        </button>
        <button
          type="button"
          title="Settings"
          onClick={() => toast(`${credits} credits remaining on the free plan`)}
          className="block w-full text-left"
        >
          <Row collapsed={collapsed}>
            <Settings className="size-[17px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
            {!collapsed && "Settings"}
          </Row>
        </button>
        {!collapsed && (
          <div className="mt-1 flex items-center gap-3 px-3 py-2">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
              S
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-medium text-sidebar-foreground">Sameer</p>
              <p className="text-[12px] text-muted-foreground">{credits} credits</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
