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
  version: "0.1.0",
  description:
    "Deterministic functional checks against data the Discovery/Browser engines already collected — currently broken links only (docs/04 Functional Engine, first slice).",
  dependencies: ["discovery-engine", "browser-engine"],
  supportedValidationTypes: ["FUNCTIONAL_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const broken = brokenLinksForPage(context);
    if (broken.length === 0) return [];

    const examples = broken.slice(0, 3).map((b) => `${b.brokenHref} (${b.reason})`).join("; ");

    const finding: EngineFinding = {
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
    };

    return [finding];
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    if (findings.length === 0) return findings;

    // Each broken link already has its own evidence (uploaded by Discovery at crawl time) — the
    // actual proof of the check, not a re-derived one. The page screenshot (if Browser Engine
    // rendered this page) adds visual context but isn't required — "no evidence, no finding"
    // (CLAUDE.md) is already satisfied by the network-check evidence alone.
    const broken = brokenLinksForPage(context);
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    const evidence: EngineEvidence[] = broken.map((b) => ({ type: "NETWORK_LOGS", content: b.evidencePath }));
    if (artifacts) evidence.push({ type: "SCREENSHOT", content: artifacts.screenshotPath });

    for (const finding of findings) finding.evidence = evidence;
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
