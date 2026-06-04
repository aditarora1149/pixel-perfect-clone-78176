import { createFileRoute } from "@tanstack/react-router";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; context?: string };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        if (!Array.isArray(body.messages)) return new Response("messages required", { status: 400 });

        const gateway = createOpenAICompatible({
          name: "lovable-ai",
          baseURL: "https://ai.gateway.lovable.dev/v1",
          headers: { "Lovable-API-Key": key },
        });

        const system = `You are ALPHADESK, an institutional-grade equity analyst grounded in the user's live computed scores. Rules:
- ALWAYS show your reasoning, the modules / scores that drove your conclusion, and any assumptions.
- NEVER fabricate prices, ratios, or news. If data is missing, say "data unavailable — requires manual verification".
- NEVER guarantee returns. Frame everything as research-backed candidates with explicit risk warnings.
- When asked about a scenario (rates, FX, oil, crypto, etc.), describe the structural sector impact and which of the user's Top 10 are most exposed.
- Format with concise markdown: short paragraphs, bullet points, bold for key numbers.
- End every answer with a one-line "Confidence:" assessment (High/Medium/Low) and a "Manual verification:" note where appropriate.

Current engine context:
${body.context ?? "(no context provided)"}`;

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});
