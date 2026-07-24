import {
  registerEngine,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";

/** Distinguishes an image request failure from any other failed page resource ("Broken
 * Resource" — script, stylesheet, font, XHR/fetch call). Image failures themselves are no longer
 * reported here — the Links & Images capability (Functional Engine) now owns "Broken Image" as a
 * real check against the actual `<img>` element (selector, bounding box, alt text), not a regex
 * guess against a failed request's URL text. This regex is kept only to EXCLUDE image requests
 * from "Broken Resource" so the same failure isn't reported twice by two different engines. */
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|bmp|avif)(\?.*)?$/i;

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine" | "location"> {
  // Location not yet adopted by this Engine (docs/03: migrated one capability at a time).
  return { pageUrl: context.page!.url, engine: "BROWSER_VALIDATION", location: null };
}

export const browserValidationEngine: Engine = {
  id: "browser-validation-engine",
  name: "BROWSER_VALIDATION",
  version: "0.2.0",
  description:
    "Deterministic checks against the live browser session: console errors and broken (non-image) page resources. Missing/broken images moved to the Functional Engine's Links & Images capability, which checks the real <img> element directly instead of guessing from a failed network request's URL text.",
  dependencies: ["browser-engine"],
  supportedValidationTypes: ["BROWSER_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const findings: EngineFinding[] = [];
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts) return findings; // Browser Engine didn't produce artifacts for this page.

    const consoleErrors = artifacts.consoleMessages.filter(
      (m) => m.startsWith("[error]") || m.startsWith("[pageerror]")
    );
    if (consoleErrors.length > 0) {
      const examples = consoleErrors.slice(0, 3).join("; ");
      findings.push({
        ...findingBase(context),
        severity: "HIGH",
        confidence: 0.9,
        category: "Console Error",
        title: `${consoleErrors.length} console error${consoleErrors.length > 1 ? "s" : ""} on this page`,
        description: `The browser console logged ${consoleErrors.length} error(s) while this page loaded, e.g. ${examples}.`,
        expectedResult: "This page loads with no JavaScript errors or uncaught exceptions.",
        actualResult: `${consoleErrors.length} console error(s) logged: ${examples}.`,
        businessImpact: "Console errors often indicate broken functionality that isn't visually obvious — a script failing silently can disable an entire feature.",
        suggestedResolution: "Open this page's DevTools console and fix the underlying JavaScript error(s).",
        evidence: [],
      });
    }

    // Image request failures are excluded here — the Functional Engine's Links & Images
    // capability now reports those, checked against the real <img> element (see the header note).
    const otherResourceErrors = artifacts.networkErrors.filter((e) => !IMAGE_EXTENSIONS.test(e));

    if (otherResourceErrors.length > 0) {
      const examples = otherResourceErrors.slice(0, 3).join("; ");
      findings.push({
        ...findingBase(context),
        severity: "HIGH",
        confidence: 0.92,
        category: "Broken Resource",
        title: `${otherResourceErrors.length} broken resource${otherResourceErrors.length > 1 ? "s" : ""} on this page`,
        description: `${otherResourceErrors.length} non-image request(s) (script, stylesheet, font, or API call) failed while this page loaded, e.g. ${examples}.`,
        expectedResult: "Every resource this page requests loads successfully.",
        actualResult: `${otherResourceErrors.length} resource request(s) failed: ${examples}.`,
        businessImpact: "A failed script or stylesheet can silently break functionality or styling across the whole page.",
        suggestedResolution: "Fix or restore the failing resource(s) — check the exact URL and response in the network log evidence.",
        evidence: [],
      });
    }

    return findings;
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    if (findings.length === 0) return findings;

    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    const screenshot: EngineEvidence[] = artifacts
      ? [{ type: "SCREENSHOT", content: artifacts.screenshotPath }]
      : [];

    for (const finding of findings) {
      if (finding.category === "Console Error") {
        finding.evidence = artifacts
          ? [{ type: "CONSOLE_LOGS", content: artifacts.consoleLogPath }, ...screenshot]
          : [];
      } else {
        // Missing Image / Broken Resource — both are read straight from the network log.
        finding.evidence = artifacts
          ? [{ type: "NETWORK_LOGS", content: artifacts.networkLogPath }, ...screenshot]
          : [];
      }
    }

    return findings;
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically in validate() above.
  },

  async cleanup() {
    // Nothing to tear down — no browser/session owned by this engine.
  },
};

registerEngine(browserValidationEngine);
