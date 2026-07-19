/**
 * Manual fixture verification for computeReadability() — no test runner exists in this repo (same
 * pattern as element-matching-engine's matching.verify.ts and visual-engine's ssim.verify.ts). Run
 * via:
 *   pnpm --filter @tentwenty/content-engine exec tsx src/readability.verify.ts
 */
import { computeReadability } from "./readability";

const SIMPLE = "The cat sat on the mat. It was a hot day. The dog ran to the park.";

const COMPLEX =
  "The consolidation of heterogeneous, multidimensional stakeholder requirements necessitates a " +
  "comprehensive reconceptualization of the organization's foundational infrastructural " +
  "prerequisites, notwithstanding the considerable methodological complexities inherent therein.";

let failures = 0;
function check(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`PASS  ${label} (${detail})`);
  } else {
    console.error(`FAIL  ${label} (${detail})`);
    failures++;
  }
}

const simpleResult = computeReadability(SIMPLE);
check("simple prose scores as easy to read", !!simpleResult && simpleResult.score >= 70, `score=${simpleResult?.score}`);
check("simple prose grade is Easy or Very Easy", simpleResult?.grade === "Easy" || simpleResult?.grade === "Very Easy", `grade=${simpleResult?.grade}`);

const complexResult = computeReadability(COMPLEX);
check("dense/jargon-heavy prose scores meaningfully lower", !!complexResult && complexResult.score < (simpleResult?.score ?? 0), `score=${complexResult?.score} vs simple=${simpleResult?.score}`);
check("dense prose is graded Difficult or Very Difficult", complexResult?.grade === "Difficult" || complexResult?.grade === "Very Difficult", `grade=${complexResult?.grade}`);

const empty = computeReadability("   ");
check("empty/whitespace-only text returns null rather than a bogus score", empty === null, `result=${JSON.stringify(empty)}`);

const wordCount = computeReadability(SIMPLE)?.wordCount;
check("word count is computed correctly", wordCount === 17, `wordCount=${wordCount}`);

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("\nALL CHECKS PASSED");
