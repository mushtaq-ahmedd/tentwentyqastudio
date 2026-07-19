/**
 * Standard Levenshtein edit-distance ratio (0 = no similarity, 1 = identical after
 * normalization) — a small, well-understood algorithm rather than an external dependency. Shared
 * by the Element Matching Engine (Figma text vs DOM text) and the Content Engine (content-sheet
 * expected text vs DOM text) — both are "is this text close enough to that text" problems.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

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
