import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { MODELS } from "@/lib/store";

export type ComposerSubmit = { text: string };

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
  return (
    <PromptInput
      className="rounded-2xl border border-border bg-card shadow-composer"
      onSubmit={(message) => {
        const text = (message.text ?? "").trim();
        if (text) onSubmit({ text });
      }}
    >
      <PromptInputTextarea autoFocus={autoFocus} placeholder={placeholder} />
      <PromptInputFooter className="justify-between border-0">
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
      </PromptInputFooter>
    </PromptInput>
  );
}
