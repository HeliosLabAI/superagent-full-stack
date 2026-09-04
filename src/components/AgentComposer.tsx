import { useState } from "react";
import type { ChatStatus } from "ai";
import { Globe, ListChecks, Paperclip, X } from "lucide-react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { MODELS } from "@/lib/store";

export type ComposerSubmit = {
  text: string;
  files?: PromptInputMessage["files"];
  research: boolean;
};

function Attachments() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <PromptInputHeader className="flex flex-wrap gap-2">
      {attachments.files.map((file) => (
        <span
          key={file.id}
          className="flex max-w-[220px] items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[13px] text-secondary-foreground"
        >
          <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{file.filename ?? "attachment"}</span>
          <button
            type="button"
            aria-label="Remove attachment"
            onClick={() => attachments.remove(file.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </PromptInputHeader>
  );
}

export function AgentComposer({
  placeholder = "Assign a task or ask anything",
  status,
  model,
  onModelChange,
  onStop,
  onSubmit,
  autoFocus = true,
}: {
  placeholder?: string;
  status?: ChatStatus;
  model: string;
  onModelChange: (id: string) => void;
  onStop?: () => void;
  onSubmit: (value: ComposerSubmit) => void;
  autoFocus?: boolean;
}) {
  const [research, setResearch] = useState(true);

  return (
    <PromptInput
      accept="image/*,text/plain,application/pdf"
      className="rounded-3xl bg-card shadow-composer"
      globalDrop
      maxFiles={4}
      multiple
      onSubmit={(message) => {
        const text = (message.text ?? "").trim();
        if (!text && !message.files?.length) return;
        onSubmit({ text, files: message.files, research });
      }}
    >
      <Attachments />
      <PromptInputTextarea autoFocus={autoFocus} placeholder={placeholder} />
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments label="Add files or images" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <PromptInputButton
            onClick={() => setResearch((v) => !v)}
            variant={research ? "default" : "ghost"}
          >
            <Globe className="size-4" />
            <span className="hidden sm:inline">Research</span>
          </PromptInputButton>
          <PromptInputButton disabled variant="ghost">
            <ListChecks className="size-4" />
            <span className="hidden sm:inline">Plan mode</span>
          </PromptInputButton>
        </PromptInputTools>
        <div className="flex items-center gap-2">
          <PromptInputSelect onValueChange={onModelChange} value={model}>
            <PromptInputSelectTrigger>
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {MODELS.map((m) => (
                <PromptInputSelectItem key={m.id} value={m.id}>
                  {m.name}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
          <PromptInputSubmit
            {...(onStop ? { onStop } : {})}
            {...(status ? { status } : {})}
          />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}
