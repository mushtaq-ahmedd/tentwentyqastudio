/**
 * Workflow Engine — replays recorded/authored multi-step flows (login, registration, checkout,
 * booking, payment: docs/02 V2 "Workflow Validation") via a real Playwright browser and reports
 * the first step that fails. Deliberately pulled forward from V2 into V1 at the user's explicit
 * request; see docs/03's implementation-status note for the scope-acceleration rationale.
 *
 * A separate Engine from the Functional Engine (broken-link checking only) rather than an
 * extension of it — CLAUDE.md non-negotiable #4, "one responsibility per Engine." It's also a
 * separate Engine from the Browser Engine despite both driving Playwright: the Browser Engine's
 * scope is "page" (one browser instance per discovered page, closed immediately after) which
 * can't hold a session open across a flow's multiple steps/pages the way a real login-then-
 * checkout journey needs — so this Engine manages its own browser lifecycle entirely
 * independently (see runner.ts), the same "collection vs validation, one browser per unit of
 * work" split, just with "one flow" as the unit instead of "one page."
 *
 * scope: "audit" (once per audit, not once per page) — a flow is a whole journey across
 * potentially several pages, not a single page's concern. Findings still need a real Page row to
 * attach to (persistFindings requires an exact URL match), so this depends on discovery-engine
 * and reads the Orchestrator-resolved `anchorPage` (the first discovered page) from
 * configuration — see orchestrator.ts's comment for why this is the right anchor.
 */
import {
  registerEngine,
  uploadEvidence,
  parseViewport,
  type Engine,
  type EngineConfig,
  type EngineContext,
  type EngineFinding,
  type WorkflowTestFlow,
} from "@tentwenty/core";
import { replayFlow } from "./runner";

/** Fallback when an engine runs outside the Orchestrator's normal context-building (shouldn't
 * happen in production — mirrors Browser Engine's own fallback). */
const FALLBACK_ENGINE_CONFIG: EngineConfig = {
  screenshotQuality: "High",
  defaultTimeoutSeconds: 15,
  retryCount: 2,
  defaultViewport: "Desktop (1440x900)",
};

export const workflowEngine: Engine = {
  id: "workflow-engine",
  name: "WORKFLOW",
  version: "0.1.0",
  description:
    "Replays recorded, human-authored multi-step flows (login, registration, checkout, ...) via a real Playwright browser and reports the first step that fails (docs/02 V2 Workflow Validation).",
  dependencies: ["discovery-engine"],
  supportedValidationTypes: ["FUNCTIONAL_VALIDATION"],
  scope: "audit",

  async initialize() {
    // All real work happens in validate() — this Engine genuinely judges pass/fail (docs/03
    // Validation engine pattern), it doesn't just collect.
  },

  async validate(context: EngineContext) {
    const flows = (context.configuration.testFlows as WorkflowTestFlow[] | undefined) ?? [];
    if (flows.length === 0) return [];

    const anchorPage = context.configuration.anchorPage as { id: string; url: string } | null;
    if (!anchorPage) {
      // No page was ever discovered for this audit (e.g. the environment was unreachable) — a
      // flow finding needs a real Page row to attach to, so there's nothing safe to report.
      console.warn("Workflow Engine: no discovered page to anchor findings to — skipping flow replay.");
      return [];
    }

    const engineConfig =
      (context.configuration.engineConfig as EngineConfig | undefined) ?? FALLBACK_ENGINE_CONFIG;
    const viewport = parseViewport(engineConfig.defaultViewport);
    const timeoutMs = engineConfig.defaultTimeoutSeconds * 1000;

    const findings: EngineFinding[] = [];

    for (const flow of flows) {
      const result = await replayFlow(flow, context.environment.url, viewport, timeoutMs);
      if (result.passed) continue; // A passing flow isn't evidence of a problem — no finding.

      const screenshotPath = await uploadEvidence(
        context.auditId,
        anchorPage.id,
        "workflow-failure",
        result.screenshot,
        "image/png"
      );

      findings.push({
        pageUrl: anchorPage.url,
        engine: "WORKFLOW",
        severity: "HIGH",
        confidence: 0.95,
        category: "Test Flow Failed",
        title: `Test flow "${flow.name}" failed at step ${result.failedStepIndex + 1}`,
        description: `Step ${result.failedStepIndex + 1} (${result.failedStepLabel}) failed: ${result.errorMessage}`,
        expectedResult: `All ${flow.steps.length} step(s) of "${flow.name}" complete successfully.`,
        actualResult: `Failed at step ${result.failedStepIndex + 1}: ${result.failedStepLabel} — ${result.errorMessage}`,
        businessImpact: `A real user following this recorded flow ("${flow.name}") would be blocked or see broken behavior at this exact step — this simulates an actual multi-step user journey, not just a single page check.`,
        suggestedResolution:
          "Reproduce this step manually in a browser and inspect what actually happened. If the page's markup changed intentionally, update this flow's step accordingly rather than treating this as a bug.",
        evidence: [{ type: "SCREENSHOT", content: screenshotPath }],
      });
    }

    return findings;
  },

  async collectEvidence(_context, findings) {
    return findings; // Evidence already attached in validate() above.
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically in validate() above.
  },

  async cleanup() {
    // Nothing to tear down — replayFlow() closes its own browser per flow.
  },
};

registerEngine(workflowEngine);
