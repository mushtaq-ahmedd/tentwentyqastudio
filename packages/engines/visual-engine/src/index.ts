import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import {
  registerEngine,
  downloadEvidenceBuffer,
  getPreviousScreenshotPath,
  uploadEvidence,
  type Engine,
  type EngineContext,
  type EngineFinding,
} from "@tentwenty/core";

/** Percentage of differing pixels that triggers a finding. */
const DIFF_THRESHOLD_PERCENT = 1;
/** pixelmatch's own per-pixel color-difference sensitivity (0-1, lower = more sensitive). */
const PIXELMATCH_THRESHOLD = 0.1;
/** Medium, not High — no Ignore Rules / Approved Differences exist yet (docs/04 requires the
 * Visual Engine to respect both; see README), so legitimately dynamic content (ads, timestamps,
 * rotating banners) isn't filtered and can produce a real-but-expected difference. */
const CONFIDENCE = 0.75;

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine"> {
  return { pageUrl: context.page!.url, engine: "VISUAL" };
}

export const visualEngine: Engine = {
  id: "visual-engine",
  name: "VISUAL",
  version: "0.1.0",
  description:
    "Pixel-level audit-over-audit regression detection — compares this page's screenshot against the most recent prior audit's screenshot of the same page (docs/04 Visual Engine).",
  dependencies: ["browser-engine"],
  supportedValidationTypes: [],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (this engine genuinely judges, so it
    // follows the Validation-engine pattern, not the Collection-engine one).
  },

  async validate(context: EngineContext) {
    const pageUrl = context.page!.url;
    const artifacts = context.sharedResources.pageArtifacts?.[pageUrl];
    if (!artifacts) return [];

    const previousPath = await getPreviousScreenshotPath(context.projectId, context.auditId, pageUrl);
    if (!previousPath) return []; // first time this page has ever been audited — nothing to diff against

    let currentBuffer: Buffer;
    let previousBuffer: Buffer;
    try {
      [currentBuffer, previousBuffer] = await Promise.all([
        downloadEvidenceBuffer(artifacts.screenshotPath),
        downloadEvidenceBuffer(previousPath),
      ]);
    } catch (err) {
      // The prior screenshot may have been removed from storage — missing data, not a real
      // regression signal, so this degrades gracefully rather than failing the engine.
      console.warn(`Visual Engine: could not download screenshots for ${pageUrl}: ${(err as Error).message}`);
      return [];
    }

    const current = PNG.sync.read(currentBuffer);
    const previous = PNG.sync.read(previousBuffer);

    if (current.width !== previous.width || current.height !== previous.height) {
      // Different full-page screenshot dimensions (content length changed enough to alter page
      // height, or the viewport changed) — forcing a resize to compare would distort the result,
      // so this is skipped rather than guessed at. See README.
      return [];
    }

    const { width, height } = current;
    const diff = new PNG({ width, height });
    const diffPixelCount = pixelmatch(current.data, previous.data, diff.data, width, height, {
      threshold: PIXELMATCH_THRESHOLD,
    });
    const diffPercent = (diffPixelCount / (width * height)) * 100;

    if (diffPercent < DIFF_THRESHOLD_PERCENT) return [];

    const diffImagePath = await uploadEvidence(
      context.auditId,
      context.page!.id,
      "visual-diff",
      PNG.sync.write(diff),
      "image/png"
    );

    return [
      {
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: CONFIDENCE,
        category: "Visual Regression",
        title: `Visual difference detected (${diffPercent.toFixed(1)}% of pixels changed)`,
        description: `This page's screenshot differs from the most recent prior audit's screenshot of it by ${diffPercent.toFixed(1)}% of pixels.`,
        expectedResult: "This page renders the same as it did in the most recent prior audit.",
        actualResult: `${diffPercent.toFixed(1)}% of pixels changed since the last audit.`,
        businessImpact: "An unreviewed visual change may be an unintended regression, or a deploy that altered the page without sign-off.",
        suggestedResolution: "Review the highlighted diff image. If this change was intentional, no action is needed — this audit's screenshot automatically becomes the new baseline for the next one.",
        evidence: [
          { type: "HIGHLIGHTED_SCREENSHOT", content: diffImagePath },
          { type: "SCREENSHOT", content: artifacts.screenshotPath },
        ],
      },
    ];
  },

  async collectEvidence(_context, findings) {
    return findings; // Evidence already attached above — it's the diff image itself.
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically in validate() above.
  },

  async cleanup() {
    // Nothing to tear down.
  },
};

registerEngine(visualEngine);
