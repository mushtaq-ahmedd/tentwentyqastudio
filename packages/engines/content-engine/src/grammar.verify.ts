/**
 * Manual fixture verification for checkGrammar() — hits the real public LanguageTool API (no
 * mocking; consistent with this session's discipline of testing against real behavior). No test
 * runner exists in this repo (same pattern as element-matching-engine's matching.verify.ts). Run
 * via:
 *   pnpm --filter @tentwenty/content-engine exec tsx src/grammar.verify.ts
 */
import { checkGrammar } from "./grammar";

const BAD_GRAMMAR = "This are a test sentence with a error. She dont like it neither.";
const CLEAN = "This is a well-formed sentence with no grammatical errors in it at all.";

let failures = 0;
function check(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`PASS  ${label} (${detail})`);
  } else {
    console.error(`FAIL  ${label} (${detail})`);
    failures++;
  }
}

async function main() {
  const badIssues = await checkGrammar(BAD_GRAMMAR);
  check("known-bad grammar produces at least one issue", badIssues.length >= 1, `issues=${badIssues.length}`);
  if (badIssues.length > 0) {
    check("issues carry a message and category", !!badIssues[0].message && !!badIssues[0].category, `first=${JSON.stringify(badIssues[0])}`);
  }

  const cleanIssues = await checkGrammar(CLEAN);
  check("well-formed sentence produces no relevant-category issues", cleanIssues.length === 0, `issues=${cleanIssues.length}`);

  const empty = await checkGrammar("   ");
  check("empty/whitespace-only text short-circuits to zero issues without a request", empty.length === 0, `issues=${empty.length}`);

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
