import {
  registerEngine,
  type BrokenLink,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";

/** Distinguishes a failed image request ("Missing Image") from any other failed page resource
 * ("Broken Resource" — script, stylesheet, font, XHR/fetch call). */
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|bmp|avif)(\?.*)?$/i;

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine"> {
  return { pageUrl: context.page!.url, engine: "FUNCTIONAL" };
}

function brokenLinksForPage(context: EngineContext): BrokenLink[] {
  const pageUrl = context.page!.url;
  return (context.sharedResources.brokenLinks ?? []).filter((b) => b.pageUrl === pageUrl);
}

export const functionalEngine: Engine = {
  id: "functional-engine",
  name: "FUNCTIONAL",
  version: "0.2.0",
  description:
    "Deterministic functional checks: broken links (Discovery's crawl-time observations), plus console errors and broken page resources/missing images (docs/02's 'Browser Validation' — folded in here since docs/03's EngineName enum has no separate slot for it, and it's the same 'judge what Browser Engine already collected' pattern as broken links).",
  dependencies: ["discovery-engine", "browser-engine"],
  supportedValidationTypes: ["FUNCTIONAL_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const findings: EngineFinding[] = [];
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];

    const broken = brokenLinksForPage(context);
    if (broken.length > 0) {
      const examples = broken.slice(0, 3).map((b) => `${b.brokenHref} (${b.reason})`).join("; ");
      findings.push({
        ...findingBase(context),
        severity: "HIGH",
        confidence: 0.95,
        category: "Broken Link",
        title: `${broken.length} broken link${broken.length > 1 ? "s" : ""} found`,
        description: `Found ${broken.length} link(s) on this page pointing to a URL that returned an error or was unreachable, e.g. ${examples}.`,
        expectedResult: "Every link on this page resolves successfully.",
        actualResult: `${broken.length} link(s) failed: ${examples}.`,
        businessImpact: "Broken links interrupt user journeys and read as an unmaintained, untrustworthy site.",
        suggestedResolution: "Fix or remove the flagged link(s) — update the href or point it at a working destination.",
        evidence: [],
      });
    }

    if (artifacts) {
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

      const imageErrors = artifacts.networkErrors.filter((e) => IMAGE_EXTENSIONS.test(e));
      const otherResourceErrors = artifacts.networkErrors.filter((e) => !IMAGE_EXTENSIONS.test(e));

      if (imageErrors.length > 0) {
        const examples = imageErrors.slice(0, 3).join("; ");
        findings.push({
          ...findingBase(context),
          severity: "MEDIUM",
          confidence: 0.92,
          category: "Missing Image",
          title: `${imageErrors.length} missing image${imageErrors.length > 1 ? "s" : ""} on this page`,
          description: `${imageErrors.length} image request(s) failed while this page loaded, e.g. ${examples}.`,
          expectedResult: "Every image on this page loads successfully.",
          actualResult: `${imageErrors.length} image request(s) failed: ${examples}.`,
          businessImpact: "Missing images look unpolished and can hide important content (product photos, icons, logos).",
          suggestedResolution: "Fix the broken image path(s) or restore the missing file(s).",
          evidence: [],
        });
      }

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
      if (finding.category === "Broken Link") {
        // Each broken link already has its own evidence (uploaded by Discovery at crawl time) —
        // the actual proof of the check, not a re-derived one.
        const broken = brokenLinksForPage(context);
        finding.evidence = [
          ...broken.map((b): EngineEvidence => ({ type: "NETWORK_LOGS", content: b.evidencePath })),
          ...screenshot,
        ];
      } else if (finding.category === "Console Error") {
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

registerEngine(functionalEngine);
