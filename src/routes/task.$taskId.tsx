import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookmarkPlus,
  Copy,
  FilePlus2,
  FileText,
  Files,
  Globe,
  ListChecks,
  Pencil,
  RefreshCw,
  Share2,
  Terminal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { AgentComposer } from "@/components/AgentComposer";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  messageText,
  modelName,
  patchTask,
  relativeTime,
  saveToLibrary,
  setTaskMessages,
  spendCredit,
  useStore,
} from "@/lib/store";
import { getFiles, isFileTool, runFileTool } from "@/lib/workspace";

export const Route = createFileRoute("/task/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — SuperIntelligence Agent Platform" },
      {
        name: "description",
        content: "Follow the agent's plan, tool execution trace and workspace files for this task.",
      },
      { property: "og:title", content: "Task — SuperIntelligence Agent Platform" },
      {
        property: "og:description",
        content: "Follow the agent's plan, tool execution trace and workspace files.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TaskPage,
});

type ToolPartLike = {
  type: string;
  state: string;
  toolCallId: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function isToolPart(part: { type: string }): part is ToolPartLike {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

const toolLabel: Record<string, string> = {
  list_files: "List files",
  read_file: "Read file",
  write_file: "Write file",
  edit_file: "Edit file",
  delete_file: "Delete file",
  plan: "Plan",
  web_research: "Web research",
};

function toolName(part: ToolPartLike) {
  return part.type === "dynamic-tool" ? "tool" : part.type.slice("tool-".length);
}

function PlanCard({ input, output }: { input: unknown; output: unknown }) {
  const data = (output ?? input) as { title?: string; steps?: string[] } | undefined;
  if (!data?.steps?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <ListChecks className="size-4" /> Plan{data.title ? ` · ${data.title}` : ""}
      </div>
      <ol className="mt-3 space-y-2">
        {data.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-[14px] text-foreground">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[11px] text-muted-foreground">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TracePart({ part }: { part: ToolPartLike }) {
  const name = toolName(part);
  if (name === "plan") return <PlanCard input={part.input} output={part.output} />;

  const out = part.output as Record<string, unknown> | undefined;
  const error = part.errorText ?? (typeof out?.error === "string" ? out.error : undefined);
  const path = typeof out?.path === "string" ? out.path : undefined;

  return (
    <Tool
      className={`mb-0 rounded-2xl ${error ? "border-destructive/40 bg-destructive/5" : "bg-card"}`}
      defaultOpen={Boolean(error)}
    >
      <ToolHeader
        type={part.type as `tool-${string}`}
        state={part.state as never}
        title={`${toolLabel[name] ?? name}${path ? ` · ${path}` : ""}`}
      />
      <ToolContent>
        <ToolInput input={part.input} />
        {error ? (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-[13px] text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : typeof out?.content === "string" ? (
          <CodeBlock code={out.content} language={(path ?? "").split(".").pop() ?? "text"} />
        ) : (
          <ToolOutput output={part.output} errorText={undefined} />
        )}
      </ToolContent>
    </Tool>
  );
}

function TaskPage() {
  const { taskId } = useParams({ from: "/task/$taskId" });
  const navigate = useNavigate();
  const task = useStore((s) => s.tasks.find((t) => t.id === taskId));
  const files = useStore((s) => s.tasks.find((t) => t.id === taskId)?.files ?? {});
  const research = useStore((s) => s.plugins.web_research);
  const [model, setModel] = useState(task?.model ?? "superintelligence-1.0");
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [tab, setTab] = useState<"trace" | "files">("trace");
  const sentRef = useRef(false);

  const { messages, sendMessage, status, stop, regenerate, error, addToolOutput } = useChat({
    id: taskId,
    messages: task?.messages ?? [],
    transport: new DefaultChatTransport({ api: "/api/chat", body: { model, research } }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      const name = toolCall.toolName;
      if (!isFileTool(name)) return;
      const output = runFileTool(
        taskId,
        name,
        (toolCall.input ?? {}) as Record<string, unknown>,
      );
      addToolOutput({ tool: name as never, toolCallId: toolCall.toolCallId, output });
      if (typeof output.path === "string" && !output.error) setOpenFile(output.path);
    },
    onError: (e) => toast.error(e.message || "The agent run failed."),
    onFinish: () => spendCredit(1),
  });

  // Persist the live conversation with the task.
  useEffect(() => {
    if (messages.length) setTaskMessages(taskId, messages as UIMessage[]);
  }, [messages, taskId]);

  useEffect(() => {
    if (task?.model) setModel(task.model);
  }, [task?.model]);

  // Auto-send the prompt typed on the launcher, once.
  useEffect(() => {
    if (!task?.pendingPrompt || sentRef.current) return;
    sentRef.current = true;
    const prompt = task.pendingPrompt;
    patchTask(taskId, { pendingPrompt: undefined });
    void sendMessage({ text: prompt });
  }, [task?.pendingPrompt, taskId, sendMessage]);

  const busy = status === "submitted" || status === "streaming";

  const traceParts = useMemo(
    () =>
      messages.flatMap((m) =>
        m.parts.filter(isToolPart).map((p) => ({ ...p, key: `${m.id}-${p.toolCallId}` })),
      ),
    [messages],
  );

  const fileNames = Object.keys(files).sort();
  const activeFile = openFile && files[openFile] !== undefined ? openFile : fileNames[0];

  if (!task) {
    return (
      <AppShell title="Task not found">
        <div className="mx-auto max-w-md p-10 text-center">
          <p className="text-[15px] text-muted-foreground">
            This task no longer exists on this device.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground"
          >
            Start a new task
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeId={taskId}
      title={task.title}
      subtitle={`${modelName(task.model)} · updated ${relativeTime(task.updatedAt)}`}
      scroll={false}
      right={
        <>
          <button
            type="button"
            aria-label="Rename task"
            onClick={() => {
              const next = window.prompt("Rename task", task.title);
              if (next?.trim()) patchTask(taskId, { title: next.trim() });
            }}
            className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:bg-accent"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Share task"
            onClick={() => {
              void navigator.clipboard
                .writeText(window.location.href)
                .then(() => toast.success("Task link copied"));
            }}
            className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:bg-accent"
          >
            <Share2 className="size-4" />
          </button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1">
        {/* Left: conversation */}
        <section className="flex min-w-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-[720px] gap-6 px-6 py-6">
              {messages.length === 0 && !busy && (
                <ConversationEmptyState
                  icon={<Terminal className="size-5" />}
                  title="Ready to work"
                  description="Ask for research, code or documents. The agent writes real files in the workspace on the right."
                />
              )}
              {messages.map((message) => {
                const text = messageText(message as UIMessage);
                const tools = message.parts.filter(isToolPart);
                return (
                  <div key={message.id} className="space-y-3">
                    {message.role === "assistant" && tools.length > 0 && (
                      <div className="space-y-2">
                        {tools.map((p) => (
                          <div
                            key={p.toolCallId}
                            className="flex items-center gap-2 text-[13px] text-muted-foreground"
                          >
                            {toolName(p) === "web_research" ? (
                              <Globe className="size-3.5" />
                            ) : toolName(p) === "plan" ? (
                              <ListChecks className="size-3.5" />
                            ) : (
                              <FileText className="size-3.5" />
                            )}
                            <span>
                              {toolLabel[toolName(p)] ?? toolName(p)}
                              {typeof (p.input as { path?: string } | undefined)?.path === "string"
                                ? ` · ${(p.input as { path: string }).path}`
                                : ""}
                            </span>
                            {p.state !== "output-available" && p.state !== "output-error" && (
                              <Shimmer className="text-[13px]">running</Shimmer>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {text && (
                      <Message from={message.role}>
                        <MessageContent>
                          {message.role === "assistant" ? (
                            <MessageResponse>{text}</MessageResponse>
                          ) : (
                            text
                          )}
                        </MessageContent>
                      </Message>
                    )}
                    {message.role === "assistant" && text && (
                      <div className="flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          aria-label="Copy answer"
                          onClick={() => {
                            void navigator.clipboard
                              .writeText(text)
                              .then(() => toast.success("Copied"));
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          <Copy className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Regenerate"
                          disabled={busy}
                          onClick={() => void regenerate()}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Save to library"
                          onClick={() => {
                            saveToLibrary({ taskId, title: task.title, content: text });
                            toast.success("Saved to library");
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          <BookmarkPlus className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {status === "submitted" && (
                <Shimmer className="text-[14px]">SuperIntelligence is thinking…</Shimmer>
              )}
              {error && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-[13px] text-destructive">
                  {error.message}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 border-t border-border/60 px-6 py-4">
            <div className="mx-auto w-full max-w-[720px]">
              <AgentComposer
                autoFocus={false}
                model={model}
                status={status}
                onStop={() => void stop()}
                onModelChange={(id) => {
                  setModel(id);
                  patchTask(taskId, { model: id });
                }}
                onSubmit={({ text, files: attachments }) =>
                  void sendMessage({ text, files: attachments })
                }
                placeholder="Reply, refine or assign the next step"
              />
            </div>
          </div>
        </section>

        {/* Right: execution trace + workspace */}
        <aside className="hidden w-[420px] shrink-0 flex-col border-l border-border bg-sidebar lg:flex xl:w-[480px]">
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
            {(
              [
                ["trace", "Execution", Terminal],
                ["files", `Files (${fileNames.length})`, Files],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                  tab === id
                    ? "bg-sidebar-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "trace" ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              {traceParts.length === 0 ? (
                <p className="p-4 text-[13px] text-muted-foreground">
                  Tool calls appear here: plans, research lookups and every file read, write, edit
                  or delete, with errors highlighted.
                </p>
              ) : (
                traceParts.map(({ key, ...part }) => <TracePart key={key} part={part} />)
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="max-h-[38%] shrink-0 overflow-y-auto border-b border-border p-2">
                {fileNames.length === 0 ? (
                  <p className="p-3 text-[13px] text-muted-foreground">
                    The workspace is empty. Ask the agent to create files.
                  </p>
                ) : (
                  fileNames.map((name) => (
                    <div
                      key={name}
                      className={`group flex items-center gap-2 rounded-lg pr-1 ${
                        name === activeFile ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFile(name)}
                        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px] text-foreground"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{name}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {files[name].split("\n").length}L
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${name}`}
                        onClick={() => {
                          runFileTool(taskId, "delete_file", { path: name });
                          toast.success(`Deleted ${name}`);
                        }}
                        className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => {
                    const path = window.prompt("New file path", "notes.md");
                    if (!path) return;
                    runFileTool(taskId, "write_file", { path, content: "" });
                    setOpenFile(path);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground hover:bg-sidebar-accent"
                >
                  <FilePlus2 className="size-3.5" /> New file
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-3">
                {activeFile ? (
                  <CodeBlock
                    code={getFiles(taskId)[activeFile] || "(empty file)"}
                    language={activeFile.split(".").pop() ?? "text"}
                  />
                ) : (
                  <p className="text-[13px] text-muted-foreground">No file selected.</p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
