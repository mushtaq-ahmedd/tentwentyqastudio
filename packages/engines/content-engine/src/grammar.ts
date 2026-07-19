/**
 * Grammar/spelling checking via the public LanguageTool API (https://languagetool.org/) — a real,
 * rule-based grammar/spell checker (typo dictionaries + grammar pattern rules), not an LLM
 * judgement call. This is what makes it fit the "deterministic validation before AI" rule: every
 * issue returned here is a specific matched rule (TYPOS, GRAMMAR, CONFUSED_WORDS category), not a
 * generated opinion. It replaces the previous state where "Grammar Validation" only checked
 * placeholder text and empty headings — genuinely unrelated to grammar — leaving real
 * grammar/spelling errors completely undetected.
 *
 * Uses the free public API rather than a self-hosted LanguageTool server — self-hosting needs a
 * Java runtime/Docker container, unavailable in this environment (the same constraint that led to
 * WASM OpenCV over a native binding elsewhere in this engine set). The public API is rate-limited
 * (~20 requests/minute, ~20KB/request unauthenticated) and best-effort: a network failure or
 * rate-limit response must never fail the engine (docs/04 non-negotiable #7 — no single engine
 * failure kills an audit) or the audit as a whole — it's simply skipped and logged, the same
 * failure-handling philosophy docs/06 requires for AI providers ("if unavailable, continue... AI
 * failure must never block report generation").
 */

const LANGUAGETOOL_ENDPOINT = "https://api.languagetool.org/v2/check";
/** Stays well under the public API's per-request size limit and keeps requests fast. */
const MAX_TEXT_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 10_000;
/** Restricted to categories with genuinely low false-positive rates on real prose. CASING and
 * PUNCTUATION are deliberately excluded — they fire constantly on legitimate web-copy style
 * (sentence fragments, Title Case headings) and would hurt precision more than they'd help. */
const RELEVANT_CATEGORIES = new Set(["TYPOS", "GRAMMAR", "CONFUSED_WORDS"]);

export type GrammarIssue = {
  message: string;
  shortMessage: string;
  snippet: string;
  replacements: string[];
  category: string;
  ruleId: string;
};

type LanguageToolResponse = {
  matches: {
    message: string;
    shortMessage: string;
    offset: number;
    length: number;
    replacements: { value: string }[];
    rule: { id: string; category: { id: string } };
  }[];
};

export async function checkGrammar(text: string, language = "en-US"): Promise<GrammarIssue[]> {
  const trimmed = text.slice(0, MAX_TEXT_LENGTH);
  if (!trimmed.trim()) return [];

  let response: Response;
  try {
    response = await fetch(LANGUAGETOOL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text: trimmed, language }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.warn(`Content Engine: LanguageTool request failed, skipping grammar check: ${(err as Error).message}`);
    return [];
  }

  if (!response.ok) {
    console.warn(`Content Engine: LanguageTool returned HTTP ${response.status}, skipping grammar check.`);
    return [];
  }

  let data: LanguageToolResponse;
  try {
    data = (await response.json()) as LanguageToolResponse;
  } catch (err) {
    console.warn(`Content Engine: could not parse LanguageTool response, skipping grammar check: ${(err as Error).message}`);
    return [];
  }

  return data.matches
    .filter((m) => RELEVANT_CATEGORIES.has(m.rule.category.id))
    .map((m) => ({
      message: m.message,
      shortMessage: m.shortMessage || m.message,
      snippet: trimmed.slice(Math.max(0, m.offset - 20), m.offset + m.length + 20).trim(),
      replacements: m.replacements.slice(0, 3).map((r) => r.value),
      category: m.rule.category.id,
      ruleId: m.rule.id,
    }));
}
