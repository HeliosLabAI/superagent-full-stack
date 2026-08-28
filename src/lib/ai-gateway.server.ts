import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const AGENT_MODELS = {
  "superintelligence-1.0": "google/gemini-3.7-flash",
  "superintelligence-1.0-pro": "google/gemini-3.1-pro-preview",
  "superintelligence-lite": "google/gemini-3.1-flash-lite",
} as const;

export type AgentModelId = keyof typeof AGENT_MODELS;

export function resolveModel(id: string | undefined): string {
  if (id && id in AGENT_MODELS) return AGENT_MODELS[id as AgentModelId];
  return AGENT_MODELS["superintelligence-1.0"];
}
