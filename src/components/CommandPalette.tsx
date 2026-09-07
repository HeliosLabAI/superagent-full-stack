import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { messageText, relativeTime, useStore } from "@/lib/store";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const tasks = useStore((s) => s.tasks);

  const go = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tasks…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(() => navigate({ to: "/" }))}>
            <Plus className="size-4" /> New task
          </CommandItem>
        </CommandGroup>
        {tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.slice(0, 30).map((task) => (
              <CommandItem
                key={task.id}
                value={`${task.title} ${task.messages.map(messageText).join(" ").slice(0, 400)}`}
                onSelect={() =>
                  go(() => navigate({ to: "/task/$taskId", params: { taskId: task.id } }))
                }
              >
                <MessageSquare className="size-4" />
                <span className="truncate">{task.title}</span>
                <span className="ml-auto text-[12px] text-muted-foreground">
                  {relativeTime(task.updatedAt)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
