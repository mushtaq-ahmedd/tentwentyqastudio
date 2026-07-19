import { registerEngine, getFigmaFrames, type Engine, type EngineContext } from "@tentwenty/core";

export const figmaEngine: Engine = {
  id: "figma-engine",
  name: "FIGMA",
  version: "0.1.0",
  description:
    "Downloads and caches a project's Figma file, extracting top-level frames/components as design data for later comparison (docs/04 Figma Engine).",
  dependencies: [],
  supportedValidationTypes: ["FIGMA_COMPARISON"],
  scope: "audit",

  async initialize(context: EngineContext) {
    const fileUrl = context.configuration.figmaFileUrl as string | null | undefined;
    const accessToken = context.configuration.figmaAccessToken as string | null | undefined;
    if (!fileUrl || !accessToken) {
      // Invalid configuration — permanent failure, never retried (docs/03 Retry policy).
      throw new Error(
        "This project has no Figma file connected, or is missing a Figma access token. Connect Figma from the project's Overview page before running a Figma Comparison audit."
      );
    }

    context.sharedResources.figmaFrames = await getFigmaFrames(context.projectId, fileUrl, accessToken);
  },

  async validate() {
    return []; // Collection engine — never judges (docs/03 Engine Categories).
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — a Collection engine never produces findings to score.
  },

  async cleanup() {
    // No persistent resources — figma-cache.ts's fetch/DB calls are already complete by the time
    // initialize() returns.
  },
};

registerEngine(figmaEngine);
