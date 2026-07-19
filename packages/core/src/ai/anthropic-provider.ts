import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, auditSummaryPrompt, findingExplanationPrompt } from "./prompts";
import type { AIProvider, AuditSummaryInput, FindingExplanationInput } from "./types";

/** Only used if `PlatformSettings.aiDefaultModel` is somehow unavailable (the row is upserted
 * into existence on every Settings read, so this is a rare first-run edge case, not the normal
 * path) — matches the schema's own `aiDefaultModel` default so the fallback is consistent with
 * the configured default rather than a second, independent choice. */
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 300;

export function createAnthropicProvider(apiKey: string, model = DEFAULT_MODEL): AIProvider {
  const client = new Anthropic({ apiKey });

  async function complete(userPrompt: string): Promise<string> {
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic response contained no text content.");
    }
    return textBlock.text.trim();
  }

  return {
    name: "anthropic",
    async explainFinding(input: FindingExplanationInput) {
      return complete(findingExplanationPrompt(input));
    },
    async summarizeAudit(input: AuditSummaryInput) {
      return complete(auditSummaryPrompt(input));
    },
  };
}
