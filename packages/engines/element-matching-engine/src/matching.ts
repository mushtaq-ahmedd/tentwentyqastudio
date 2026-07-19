/**
 * The actual matching algorithm — kept pure and dependency-free (no Engine/EngineContext types)
 * so it can be exercised directly with synthetic data, independent of a real Figma/Playwright
 * round-trip. See docs/04 Element Matching: "matches Figma components to website elements using
 * text, position, size, parent, component type, accessibility role, and visual similarity."
 *
 * This first slice implements **text only** — the one signal usable without either a coordinate-
 * system reconciliation (Figma frame space vs. rendered viewport space, which don't share an
 * origin or scale) or real image-diffing infrastructure (Pixelmatch/OpenCV, which is the Visual
 * Engine's job and doesn't exist yet). Position/size/type/role/visual-similarity are real gaps,
 * not oversights — see the README.
 */
import type { DomElement, ElementMatch, FigmaElement, FigmaFrame } from "@tentwenty/core";

/** Below this normalized edit-distance similarity, two text strings are not considered a match —
 * high enough to tolerate minor punctuation/whitespace differences, not so low that unrelated
 * short strings (e.g. "Home" vs "Help") pass. */
export const MATCH_THRESHOLD = 0.82;
/** Below this, a Figma frame's name isn't considered a plausible match for a page's name — loose,
 * since it's just a tiebreaker for scoping which frame's elements to compare against; falls back
 * to comparing against every element in the file when nothing clears it. */
export const FRAME_MATCH_THRESHOLD = 0.5;

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Standard Levenshtein edit-distance ratio (0 = no similarity, 1 = identical after
 * normalization) — a small, well-understood algorithm rather than an external dependency. */
export function textSimilarity(a: string, b: string): number {
  const s1 = normalize(a);
  const s2 = normalize(b);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const dp: number[][] = Array.from({ length: s1.length + 1 }, () => new Array(s2.length + 1).fill(0));
  for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= s2.length; j++) dp[0][j] = j;
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      dp[i][j] =
        s1[i - 1] === s2[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const distance = dp[s1.length][s2.length];
  return 1 - distance / Math.max(s1.length, s2.length);
}

/** Picks the Figma frame whose name best matches the page's name; returns `null` if nothing
 * clears `FRAME_MATCH_THRESHOLD` (caller should then compare against every element in the file). */
export function bestMatchingFrame(pageName: string, frames: FigmaFrame[]): FigmaFrame | null {
  let best: { frame: FigmaFrame; score: number } | null = null;
  for (const frame of frames) {
    const score = textSimilarity(pageName, frame.name);
    if (!best || score > best.score) best = { frame, score };
  }
  return best && best.score >= FRAME_MATCH_THRESHOLD ? best.frame : null;
}

/**
 * Greedy, order-preserving match: for each Figma element (in extraction order), claims the
 * best-scoring unclaimed DOM element above `MATCH_THRESHOLD`. Greedy rather than a full optimal
 * assignment (e.g. Hungarian algorithm) — simpler, deterministic, and good enough when most
 * elements have distinguishable text; duplicate-text elements (e.g. repeated "Learn More"
 * buttons) fall back to whichever unclaimed candidate scores highest, which is usually the
 * next one in document order.
 */
export function matchElements(
  pageUrl: string,
  figmaElements: FigmaElement[],
  domElements: DomElement[]
): ElementMatch[] {
  const claimed = new Set<number>();
  const matches: ElementMatch[] = [];

  for (const figmaEl of figmaElements) {
    let best: { index: number; score: number } | null = null;
    for (let i = 0; i < domElements.length; i++) {
      if (claimed.has(i)) continue;
      const score = textSimilarity(figmaEl.text, domElements[i].text);
      if (!best || score > best.score) best = { index: i, score };
    }

    if (best && best.score >= MATCH_THRESHOLD) {
      claimed.add(best.index);
      const dom = domElements[best.index];
      matches.push({
        pageUrl,
        figmaElementId: figmaEl.id,
        figmaElementName: figmaEl.name,
        figmaText: figmaEl.text,
        matched: true,
        domText: dom.text,
        domTag: dom.tag,
        confidence: best.score,
      });
    } else {
      matches.push({
        pageUrl,
        figmaElementId: figmaEl.id,
        figmaElementName: figmaEl.name,
        figmaText: figmaEl.text,
        matched: false,
      });
    }
  }

  return matches;
}
