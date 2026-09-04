import { useEffect, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { hydrate, useStore } from "@/lib/store";

export function AppShell({
  activeId,
  title,
  subtitle,
  right,
  children,
  scroll = true,
}: {
  activeId?: string | undefined;
  title?: ReactNode;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const credits = useStore((s) => s.credits);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeId={activeId} onSearch={() => setPaletteOpen(true)} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold text-foreground">{title}</div>
            {subtitle && (
              <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {right}
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[14px] font-medium">
              <Sparkles className="size-4 text-muted-foreground" />
              {credits}
            </div>
          </div>
        </header>
        <div className={scroll ? "min-h-0 flex-1 overflow-y-auto" : "flex min-h-0 flex-1 flex-col"}>
          {children}
        </div>
      </main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
