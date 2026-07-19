import { prisma } from "@tentwenty/db";
import { createAnthropicProvider } from "./anthropic-provider";
import type { AIProvider } from "./types";

/**
 * Reads which provider/model to use from `PlatformSettings` (`platform_settings`, docs/05's
 * documented "settings" table — "AI provider" is explicitly one of its listed fields) — this is
 * the platform's existing, real configuration mechanism, not something this engine invents in
 * parallel. Only the API key is read from the environment (`ANTHROPIC_API_KEY`): it's a secret,
 * and `PlatformSettings` has no field meant to hold one. Returns `null` if no key is configured,
 * or the configured provider has no implementation — docs/06 "If a provider is unavailable:
 * continue the audit, generate the report without AI content, log the failure." Switching
 * providers means changing the Settings row (once its UI is wired — a separate, tracked gap) or
 * the row directly, never editing the AI Engine itself (docs/06 "switching providers should
 * require only configuration changes").
 */
export async function getConfiguredAIProvider(): Promise<AIProvider | null> {
  const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } });
  const provider = (settings?.aiProvider ?? "Anthropic").toLowerCase();
  const model = settings?.aiDefaultModel;

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    return createAnthropicProvider(apiKey, model);
  }

  // docs/06 names OpenAI/Claude/Gemini as "initial providers" — only Claude has a real
  // implementation so far. Flagged, not silently ignored.
  console.warn(`Configured AI provider "${settings?.aiProvider}" has no implementation yet — continuing without AI content.`);
  return null;
}
