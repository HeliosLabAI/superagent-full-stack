import { useEffect, useRef, useState } from "react";
import { ArrowUp, AudioLines, Mic, Monitor, Plus, Settings2 } from "lucide-react";

export function Composer({
  placeholder = "Assign a task or type / for more",
  onSubmit,
  autoFocus = true,
}: {
  placeholder?: string;
  onSubmit: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    setValue("");
    onSubmit(v);
    ref.current?.focus();
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-3 shadow-composer">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-3 pt-2 text-[16px] text-foreground outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          {[Plus, Settings2, Monitor].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-accent"
              aria-label="Composer action"
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          {[AudioLines, Mic].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-accent"
              aria-label="Voice"
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
            </button>
          ))}
          <button
            type="button"
            onClick={submit}
            aria-label="Send"
            className="grid size-9 place-items-center rounded-full bg-accent text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowUp className="size-[18px]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
