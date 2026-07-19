/**
 * Flesch Reading Ease (Flesch, 1948) — a pure deterministic formula computed entirely from
 * sentence/word/syllable counts, no network dependency at all. docs/04 explicitly lists
 * "readability" as a Content Engine responsibility; this is the industry-standard formula for it
 * (the same one behind Microsoft Word's and Google Docs' readability stats), not a bespoke
 * approximation. Because it needs no external service, it always runs regardless of whether
 * LanguageTool (grammar.ts) is reachable.
 */

export type ReadabilityResult = {
  /** 0-100, higher = easier to read. */
  score: number;
  grade: "Very Easy" | "Easy" | "Standard" | "Difficult" | "Very Difficult";
  wordCount: number;
  sentenceCount: number;
};

const VOWEL_GROUPS = /[aeiouy]+/gi;

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let count = (w.match(VOWEL_GROUPS) || []).length;
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

function gradeFor(score: number): ReadabilityResult["grade"] {
  if (score >= 90) return "Very Easy";
  if (score >= 70) return "Easy";
  if (score >= 60) return "Standard";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
}

/** Returns null when there isn't enough flowing text to score meaningfully — the formula is noisy
 * on a handful of words (e.g. nav labels), so callers should require a minimum word count anyway. */
export function computeReadability(text: string): ReadabilityResult | null {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return null;

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
  const clamped = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  return { score: clamped, grade: gradeFor(clamped), wordCount: words.length, sentenceCount: sentences.length };
}
