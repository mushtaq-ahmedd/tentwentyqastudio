import { registerEngine, type Engine, type EngineContext } from "@tentwenty/core";
import { bestMatchingFrame, matchElements } from "./matching";

export const elementMatchingEngine: Engine = {
  id: "element-matching-engine",
  name: "ELEMENT_MATCHING",
  version: "0.1.0",
  description:
    "Matches Figma design elements to rendered DOM elements on each page, by text — the prerequisite step before pixel/attribute comparison (docs/04 Element Matching).",
  dependencies: ["figma-engine", "browser-engine"],
  // Not a user-selectable ValidationType (docs/09 has no "Element Matching" option) — it's
  // infrastructure the not-yet-built UI/Visual Validation engines depend on, always included
  // whenever Figma Comparison is selected (see apps/web/src/lib/api/audits.ts), same treatment
  // as Discovery/Browser being unconditionally included.
  supportedValidationTypes: [],
  scope: "page",

  async initialize(context: EngineContext) {
    const pageUrl = context.page!.url;
    const pageName = context.page!.name;
    const figmaFrames = context.sharedResources.figmaFrames ?? [];
    const figmaElements = context.sharedResources.figmaElements ?? [];
    const domElements = context.sharedResources.pageArtifacts?.[pageUrl]?.domElements ?? [];

    if (figmaElements.length === 0 || domElements.length === 0) {
      // Figma Engine found no text elements, or Browser Engine didn't render this page — nothing
      // to match. Not an error: a Collection-like engine degrades gracefully, it doesn't fail the
      // audit over another engine's gap.
      return;
    }

    const frame = bestMatchingFrame(pageName, figmaFrames);
    const candidateElements = frame
      ? figmaElements.filter((e) => e.parentFrameId === frame.id)
      : figmaElements;

    const matches = matchElements(pageUrl, candidateElements, domElements);

    context.sharedResources.elementMatches ??= [];
    context.sharedResources.elementMatches.push(...matches);

    // Structured, searchable logging (docs/03 "Logging (per Engine)") — also the only way to
    // inspect this engine's real output today, since nothing downstream (UI Validation) exists
    // yet to surface it as a Finding.
    const matchedCount = matches.filter((m) => m.matched).length;
    console.log(
      JSON.stringify({
        engine: "ELEMENT_MATCHING",
        pageUrl,
        matchedFrame: frame?.name ?? null,
        elementsConsidered: candidateElements.length,
        matched: matchedCount,
        unmatched: matches.length - matchedCount,
      })
    );
  },

  async validate() {
    return []; // Prepares data only — doesn't judge (docs/03); no Findings of its own.
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — this engine never produces findings to score.
  },

  async cleanup() {
    // Nothing to tear down — no browser/session/upload owned by this engine.
  },
};

registerEngine(elementMatchingEngine);
