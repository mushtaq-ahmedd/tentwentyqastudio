/**
 * Real Playwright replay of one recorded/authored TestFlow (docs/02 V2 "Workflow Validation",
 * pulled forward — see index.ts's header comment). Kept separate from index.ts so this pure
 * replay logic can be exercised directly by runner.verify.ts against a real fixture page, the
 * same "verify the foundation before wiring it into an Engine" discipline used for ssim.ts and
 * grammar.ts elsewhere in this codebase.
 *
 * Deterministic by construction: every step is a concrete Playwright action or a poll against an
 * observable page property (URL, element text/visibility) — never an AI judgement call about
 * whether the page "looks right." The first step that fails stops the flow and is reported
 * exactly as observed (its error message), not paraphrased or guessed at.
 */
import { chromium, type Page } from "playwright";
import { TransientEngineError, type WorkflowFlowStep, type WorkflowTestFlow } from "@tentwenty/core";

const POLL_INTERVAL_MS = 200;

export type FlowReplayResult =
  | { passed: true }
  | {
      passed: false;
      failedStepIndex: number;
      failedStepLabel: string;
      errorMessage: string;
      screenshot: Buffer;
    };

function resolveUrl(pathOrUrl: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, baseUrl).toString();
}

function stepLabel(step: WorkflowFlowStep): string {
  switch (step.action) {
    case "NAVIGATE":
      return `Navigate to "${step.value}"`;
    case "CLICK":
      return `Click "${step.selector}"`;
    case "FILL":
      return `Fill "${step.selector}" with "${step.value}"`;
    case "PRESS_KEY":
      return `Press "${step.value}" on "${step.selector ?? "page"}"`;
    case "ASSERT_VISIBLE":
      return `Assert "${step.selector}" is visible`;
    case "ASSERT_TEXT":
      return `Assert text "${step.value}"${step.selector ? ` within "${step.selector}"` : ""}`;
    case "ASSERT_URL":
      return `Assert URL contains "${step.value}"`;
  }
}

/** Polls `check` until it returns true or `timeoutMs` elapses — used for the two assertion
 * actions, which aren't a single Playwright call the way click/fill are. A throwing `check` (e.g.
 * the target element doesn't exist yet) counts as "not yet true," not an immediate failure. */
async function poll(check: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const result = await check().catch(() => false);
    if (result) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

async function runStep(page: Page, step: WorkflowFlowStep, baseUrl: string, timeoutMs: number): Promise<void> {
  switch (step.action) {
    case "NAVIGATE":
      await page.goto(resolveUrl(step.value ?? "/", baseUrl), { waitUntil: "load", timeout: timeoutMs });
      return;
    case "CLICK":
      if (!step.selector) throw new Error("CLICK step is missing a selector.");
      await page.locator(step.selector).click({ timeout: timeoutMs });
      return;
    case "FILL":
      if (!step.selector) throw new Error("FILL step is missing a selector.");
      await page.locator(step.selector).fill(step.value ?? "", { timeout: timeoutMs });
      return;
    case "PRESS_KEY":
      if (step.selector) {
        await page.locator(step.selector).press(step.value ?? "Enter", { timeout: timeoutMs });
      } else {
        await page.keyboard.press(step.value ?? "Enter");
      }
      return;
    case "ASSERT_VISIBLE":
      if (!step.selector) throw new Error("ASSERT_VISIBLE step is missing a selector.");
      await page.locator(step.selector).waitFor({ state: "visible", timeout: timeoutMs });
      return;
    case "ASSERT_TEXT": {
      const expected = step.value ?? "";
      const found = await poll(async () => {
        const text = step.selector
          ? await page.locator(step.selector as string).innerText()
          : await page.locator("body").innerText();
        return text.includes(expected);
      }, timeoutMs);
      if (!found) {
        throw new Error(
          `Expected text "${expected}" was not found${step.selector ? ` within "${step.selector}"` : " on the page"}.`
        );
      }
      return;
    }
    case "ASSERT_URL": {
      const expected = step.value ?? "";
      const found = await poll(async () => page.url().includes(expected), timeoutMs);
      if (!found) throw new Error(`Expected URL to contain "${expected}", actual URL was "${page.url()}".`);
      return;
    }
  }
}

/** Replays one flow end-to-end in its own fresh browser instance (not shared across flows or
 * with the Browser Engine — a flow needs one continuous session across its steps, which the
 * Browser Engine's one-browser-per-page model can't provide; see index.ts). Launch/initial-
 * navigation failures throw TransientEngineError (retryable infra failure, docs/03); a step
 * genuinely failing partway through is not an error, it's the real, deterministic result. */
export async function replayFlow(
  flow: WorkflowTestFlow,
  environmentUrl: string,
  viewport: { width: number; height: number },
  timeoutMs: number
): Promise<FlowReplayResult> {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    throw new TransientEngineError(`Failed to launch browser for flow "${flow.name}": ${(err as Error).message}`);
  }

  try {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto(resolveUrl(flow.startUrl, environmentUrl), { waitUntil: "load", timeout: timeoutMs });
    } catch (err) {
      throw new TransientEngineError(
        `Failed to navigate to flow "${flow.name}"'s start URL: ${(err as Error).message}`
      );
    }

    const orderedSteps = [...flow.steps].sort((a, b) => a.order - b.order);
    for (let i = 0; i < orderedSteps.length; i++) {
      const step = orderedSteps[i];
      try {
        await runStep(page, step, environmentUrl, timeoutMs);
      } catch (err) {
        const screenshot = await page.screenshot({ fullPage: true, type: "png" }).catch(() => Buffer.from(""));
        return {
          passed: false,
          failedStepIndex: i,
          failedStepLabel: stepLabel(step),
          errorMessage: (err as Error).message,
          screenshot,
        };
      }
    }
    return { passed: true };
  } finally {
    await browser.close();
  }
}
