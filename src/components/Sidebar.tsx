import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Clock,
  FileText,
  FolderPlus,
  Grid2x2,
  LayoutGrid,
  type LucideIcon,
  MessagesSquare,
  Plus,
  Search,
  SlidersHorizontal,
  SquareDashed,
  Video,
  Wand2,
} from "lucide-react";
import type { Task } from "@/lib/tasks";

const nav: Array<{ label: string; icon: LucideIcon; to?: string }> = [
  { label: "New task", icon: Wand2, to: "/" },
  { label: "Agent", icon: SquareDashed },
  { label: "Search", icon: Search },
  { label: "Plugins", icon: LayoutGrid },
  { label: "Scheduled", icon: Clock },
  { label: "Library", icon: BookOpen },
];

const taskIcons: Record<string, LucideIcon> = {
  sparkle: Wand2,
  doc: FileText,
  chart: BarChart3,
  video: Video,
  grid: Grid2x2,
  spark: Wand2,
};

export function Sidebar({ tasks, activeId }: { tasks: Task[]; activeId?: string }) {
  const navigate = useNavigate();

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <nav className="px-3 pt-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const cls =
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent";
          return item.to ? (
            <Link key={item.label} to={item.to} className={cls}>
              <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              {item.label}
            </Link>
          ) : (
            <button key={item.label} type="button" className={cls}>
              <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[13px] font-medium text-muted-foreground">Projects</span>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
            aria-label="New project"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <FolderPlus className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
          New project
        </button>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-[13px] font-medium text-muted-foreground">Tasks</span>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent"
            aria-label="Filter tasks"
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          {tasks.map((task) => {
            const Icon = taskIcons[task.icon] ?? MessagesSquare;
            const active = task.id === activeId;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => navigate({ to: "/task/$taskId", params: { taskId: task.id } })}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.6} />
                <span className="truncate">{task.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            S
          </span>
          <span className="text-[15px] font-medium text-sidebar-foreground">Sameer</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <MessagesSquare className="size-[18px]" strokeWidth={1.6} />
          <Bell className="size-[18px]" strokeWidth={1.6} />
        </div>
      </div>
    </aside>
  );
}
