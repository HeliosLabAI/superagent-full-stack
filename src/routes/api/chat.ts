import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, resolveModel } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are SuperIntelligence, an autonomous agent on the SuperIntelligence Agent Platform.

You have a real, persistent per-task file workspace. Use the file tools to do actual work:
- list_files to see what exists, read_file before editing, write_file to create or replace, edit_file for targeted string replacements, delete_file to remove.
- If a tool result contains an "error" field, read the error, inspect the file with read_file or list_files, and fix it — never pretend the operation succeeded.
- When the user asks you to build something (site, script, doc, config), actually create the files in the workspace and then summarise what you wrote.

Working style:
- Use the plan tool once at the start of a multi-step task so the user can follow along.
- Use web_research only when you need current public facts; say plainly when something is uncertain.
- Be concrete. Short paragraphs, tight bullets, markdown tables where useful, fenced code blocks with language tags.
- Never claim to have browsed the internet or run code unless a tool result says so.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ error: "AI is not configured." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let body: { messages?: UIMessage[]; model?: string; research?: boolean };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request body." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "No messages provided." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const gateway = createLovableAiGatewayProvider(key);

        // Client-executed workspace tools: declared without `execute` so the
        // browser runs them against the task's persisted file workspace.
        const fileTools = {
          list_files: tool({
            description: "List every file in the task workspace with line and byte counts.",
            inputSchema: z.object({}),
          }),
          read_file: tool({
            description: "Read the full contents of a workspace file.",
            inputSchema: z.object({ path: z.string().describe("Workspace-relative path") }),
          }),
          write_file: tool({
            description: "Create a file or replace its entire contents.",
            inputSchema: z.object({
              path: z.string(),
              content: z.string().describe("Full file contents"),
            }),
          }),
          edit_file: tool({
            description: "Replace the first occurrence of `find` with `replace` in a file.",
            inputSchema: z.object({
              path: z.string(),
              find: z.string().describe("Exact existing text"),
              replace: z.string().describe("Replacement text"),
            }),
          }),
          delete_file: tool({
            description: "Delete a workspace file.",
            inputSchema: z.object({ path: z.string() }),
          }),
        };

        const result = streamText({
          model: gateway(resolveModel(body.model)),
          system: SYSTEM_PROMPT,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
            ...fileTools,
            plan: tool({
              description:
                "Publish the step-by-step plan for the current task so the user can follow progress. Call once, early.",
              inputSchema: z.object({
                title: z.string().describe("Short title for the task"),
                steps: z.array(z.string()).describe("Ordered steps you will take"),
              }),
              execute: async ({ title, steps }) => ({ title, steps, status: "published" }),
            }),
            web_research: tool({
              description:
                "Look up current public information about a topic. Returns notes gathered for the query.",
              inputSchema: z.object({ query: z.string().describe("What to research") }),
              execute: async ({ query }) => {
                if (body.research === false) {
                  return { query, related: [], note: "Research is disabled for this run." };
                }
                try {
                  const res = await fetch(
                    `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`,
                    { headers: { accept: "application/json" } },
                  );
                  const data: unknown = res.ok ? await res.json() : null;
                  const related = Array.isArray(data)
                    ? (data as unknown[])
                        .flatMap((d) =>
                          typeof d === "string"
                            ? [d]
                            : d && typeof d === "object" && "phrase" in d
                              ? [String((d as { phrase: unknown }).phrase)]
                              : [],
                        )
                        .slice(0, 8)
                    : [];
                  return { query, related, note: "Public suggestion data; verify specifics." };
                } catch {
                  return { query, related: [], note: "Research lookup unavailable." };
                }
              },
            }),
          },
          onError: ({ error }) => {
            console.error("chat stream error", error);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: (error) =>
            error instanceof Error ? error.message : "The agent run failed. Please try again.",
        });
      },
    },
  },
});
