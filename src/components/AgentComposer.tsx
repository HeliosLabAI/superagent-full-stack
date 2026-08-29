import { useState } from "react";
import type { ChatStatus } from "ai";
import { Globe, ListChecks } from "lucide-react";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { MODELS } from "@/lib/store";

export type ComposerSubmit = {
  text: string;
  files?: PromptInputMessage["files"];
  research: boolean;
};

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
      accept="image/*,text/*,application/pdf"
      className="rounded-3xl border-border bg-card shadow-composer"
      globalDrop
      maxFiles={4}
      multiple
      onSubmit={(message, event) => {
        const text = (message.text ?? "").trim();
        if (!text && !message.files?.length) return;
        onSubmit({ text, files: message.files, research });
        event.currentTarget.reset();
      }}
    >
      <PromptInputAttachments>
        {(attachment) => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>
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
            <span className="hidden sm:inline">Plan mode on</span>
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
          <PromptInputSubmit onStop={onStop} status={status} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}
