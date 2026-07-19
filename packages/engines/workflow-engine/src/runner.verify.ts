/**
 * Manual fixture verification for replayFlow() — drives a real Playwright browser against a real
 * local fixture page (no mocking), same discipline as ssim.verify.ts/grammar.verify.ts elsewhere.
 * Requires a fixture login page running at http://localhost:4178/login (see the session scratch
 * directory's login-fixture-server.js) with:
 *   - #email, #password, #submit — a login form
 *   - correct credentials (user@test.com / correct-password) redirect to /dashboard with an
 *     #welcome heading
 *   - wrong credentials render an #error element and stay on /login
 *
 * Run via:
 *   pnpm --filter @tentwenty/workflow-engine exec tsx src/runner.verify.ts
 */
import { replayFlow } from "./runner";
import type { WorkflowTestFlow } from "@tentwenty/core";

const BASE_URL = "http://localhost:4178";
const VIEWPORT = { width: 1280, height: 800 };
const TIMEOUT_MS = 5000;

const PASSING_FLOW: WorkflowTestFlow = {
  id: "verify-passing",
  name: "Login (correct credentials)",
  startUrl: "/login",
  steps: [
    { order: 1, action: "FILL", selector: "#email", value: "user@test.com" },
    { order: 2, action: "FILL", selector: "#password", value: "correct-password" },
    { order: 3, action: "CLICK", selector: "#submit", value: null },
    { order: 4, action: "ASSERT_URL", selector: null, value: "/dashboard" },
    { order: 5, action: "ASSERT_TEXT", selector: "#welcome", value: "Welcome back" },
  ],
};

const FAILING_FLOW: WorkflowTestFlow = {
  id: "verify-failing",
  name: "Login (wrong password)",
  startUrl: "/login",
  steps: [
    { order: 1, action: "FILL", selector: "#email", value: "user@test.com" },
    { order: 2, action: "FILL", selector: "#password", value: "wrong-password" },
    { order: 3, action: "CLICK", selector: "#submit", value: null },
    { order: 4, action: "ASSERT_URL", selector: null, value: "/dashboard" },
  ],
};

const BROKEN_SELECTOR_FLOW: WorkflowTestFlow = {
  id: "verify-broken-selector",
  name: "Login (nonexistent field)",
  startUrl: "/login",
  steps: [{ order: 1, action: "FILL", selector: "#does-not-exist", value: "x" }],
};

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
  const passing = await replayFlow(PASSING_FLOW, BASE_URL, VIEWPORT, TIMEOUT_MS);
  check("correct credentials flow passes end-to-end", passing.passed === true, `result=${JSON.stringify(passing).slice(0, 200)}`);

  const failing = await replayFlow(FAILING_FLOW, BASE_URL, VIEWPORT, TIMEOUT_MS);
  check("wrong-password flow is reported as failed, not passed", failing.passed === false, `passed=${failing.passed}`);
  if (!failing.passed) {
    check("failure is attributed to the ASSERT_URL step (index 3)", failing.failedStepIndex === 3, `failedStepIndex=${failing.failedStepIndex}`);
    check("failure carries a real error message", failing.errorMessage.length > 0, `errorMessage="${failing.errorMessage}"`);
    check("failure carries a non-empty screenshot", failing.screenshot.length > 0, `screenshotBytes=${failing.screenshot.length}`);
  }

  const broken = await replayFlow(BROKEN_SELECTOR_FLOW, BASE_URL, VIEWPORT, TIMEOUT_MS);
  check("a selector matching nothing fails at step 0, not silently passes", broken.passed === false, `passed=${broken.passed}`);

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
