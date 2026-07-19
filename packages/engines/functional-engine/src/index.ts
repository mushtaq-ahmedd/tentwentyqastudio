import {
  registerEngine,
  type BrokenLink,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";

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
  version: "0.3.0",
  description:
    "Deterministic broken-link checking (Discovery's crawl-time observations). Console errors, missing images, and broken resources moved to the Browser Validation Engine — docs/02 lists them as a separate V1 feature, and folding them in here was a one-responsibility-per-Engine violation (CLAUDE.md non-negotiable #4).",
  dependencies: ["discovery-engine", "browser-engine"],
  supportedValidationTypes: ["FUNCTIONAL_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const findings: EngineFinding[] = [];

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

    return findings;
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    if (findings.length === 0) return findings;

    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    const screenshot: EngineEvidence[] = artifacts
      ? [{ type: "SCREENSHOT", content: artifacts.screenshotPath }]
      : [];

    // Each broken link already has its own evidence (uploaded by Discovery at crawl time) — the
    // actual proof of the check, not a re-derived one.
    const broken = brokenLinksForPage(context);
    for (const finding of findings) {
      finding.evidence = [
        ...broken.map((b): EngineEvidence => ({ type: "NETWORK_LOGS", content: b.evidencePath })),
        ...screenshot,
      ];
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
