import {
  registerEngine,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";

/** Below this, a "matched" element's live text is close enough to the Figma design that it isn't
 * worth flagging — MATCH_THRESHOLD (0.82, element-matching-engine) already only accepts fairly
 * close matches, so this only excludes near-perfect ones (trivial rounding, not meaningful
 * wording differences). */
const TEXT_DIFF_THRESHOLD = 0.98;
const MISSING_ELEMENT_CONFIDENCE = 0.78;
const TEXT_DIFF_CONFIDENCE = 0.9;

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine"> {
  return { pageUrl: context.page!.url, engine: "UI_VALIDATION" };
}

export const uiValidationEngine: Engine = {
  id: "ui-validation-engine",
  name: "UI_VALIDATION",
  version: "0.1.0",
  description:
    "Deterministic design-fidelity checks from Element Matching's results: design elements missing from the live page, and live text that drifted from the Figma design (docs/04 UI Validation, first slice).",
  dependencies: ["element-matching-engine", "browser-engine"],
  supportedValidationTypes: ["UI_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const pageUrl = context.page!.url;
    const matches = (context.sharedResources.elementMatches ?? []).filter((m) => m.pageUrl === pageUrl);
    if (matches.length === 0) return [];

    const missingTexts: string[] = [];
    const textDiffExamples: string[] = [];
    for (const m of matches) {
      if (!m.matched) {
        missingTexts.push(m.figmaText);
      } else if (m.confidence < TEXT_DIFF_THRESHOLD) {
        textDiffExamples.push(`"${m.figmaText}" → "${m.domText}"`);
      }
    }

    const findings: EngineFinding[] = [];

    if (missingTexts.length > 0) {
      const examples = missingTexts.slice(0, 3).map((t) => `"${t}"`).join(", ");
      findings.push({
        ...findingBase(context),
        severity: "HIGH",
        confidence: MISSING_ELEMENT_CONFIDENCE,
        category: "Missing Design Element",
        title: `${missingTexts.length} design element${missingTexts.length > 1 ? "s" : ""} not found on the live page`,
        description: `The connected Figma design has ${missingTexts.length} text element(s) with no matching element found on this page, e.g. ${examples}.`,
        expectedResult: "Every text element in the Figma design has a corresponding element on the live page.",
        actualResult: `No matching live element found for: ${examples}.`,
        businessImpact: "A missing design element may mean this page doesn't match what was approved — missing content or a broken layout.",
        suggestedResolution: "Confirm whether this element should be present. If so, add it to the page; if the design changed, update the connected Figma file instead.",
        evidence: [],
      });
    }

    if (textDiffExamples.length > 0) {
      const examples = textDiffExamples.slice(0, 3).join("; ");
      findings.push({
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: TEXT_DIFF_CONFIDENCE,
        category: "Design/Live Text Mismatch",
        title: `${textDiffExamples.length} element${textDiffExamples.length > 1 ? "s" : ""} with text differing from the Figma design`,
        description: `Found ${textDiffExamples.length} matched element(s) whose live text doesn't exactly match the connected Figma design, e.g. ${examples}.`,
        expectedResult: "Live page text matches the approved Figma design exactly.",
        actualResult: `Text differs from design: ${examples}.`,
        businessImpact: "Text that drifted from the approved design may be an unreviewed change or a typo introduced during implementation.",
        suggestedResolution: "Confirm whether the live text or the Figma design is correct, and update whichever is stale.",
        evidence: [],
      });
    }

    return findings;
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    if (findings.length === 0) return findings;

    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts) return findings;

    // Same already-uploaded Browser Engine artifacts every finding on this page references —
    // no re-upload needed (docs/03 "Evidence is referenced, not embedded").
    const shared: EngineEvidence[] = [
      { type: "SCREENSHOT", content: artifacts.screenshotPath },
      { type: "HTML_SNAPSHOT", content: artifacts.domSnapshotPath },
    ];
    for (const finding of findings) finding.evidence = shared;
    return findings;
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically per check in validate() above.
  },

  async cleanup() {
    // Nothing to tear down — no browser/session/upload owned by this engine.
  },
};

registerEngine(uiValidationEngine);
