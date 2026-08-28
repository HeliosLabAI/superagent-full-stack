import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, resolveModel } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are SuperIntelligence, an autonomous agent on the SuperIntelligence Agent Platform.

Working style:
- Start by stating a short plan, then do the work and report concrete findings.
- Use the plan tool once at the start of any multi-step task so the user sees the steps.
- Use the web_research tool when you need current facts you are unsure about, and say plainly when information is uncertain.
- Be concrete and specific. Prefer short paragraphs, tight bullet lists and markdown tables.
- End substantial answers with a short "Next steps" list.
Never claim to have browsed the internet or executed code unless a tool result says so.`;

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

        let body: { messages?: UIMessage[]; model?: string };
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

        const result = streamText({
          model: gateway(resolveModel(body.model)),
          system: SYSTEM_PROMPT,
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(50),
          tools: {
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
              inputSchema: z.object({
                query: z.string().describe("What to research"),
              }),
              execute: async ({ query }) => {
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
