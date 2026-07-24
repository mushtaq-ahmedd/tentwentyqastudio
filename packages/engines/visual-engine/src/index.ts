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
import { computeSsim } from "./ssim";

/** pixelmatch's own per-pixel color-difference sensitivity (0-1, lower = more sensitive) — still
 * used to render the highlighted diff evidence image (a human-reviewable visualization), even
 * though it's no longer what decides whether a finding is raised (see ssim.ts's header comment
 * for why: raw pixel-diff can't distinguish a genuine change from anti-aliasing/render noise). */
const PIXELMATCH_THRESHOLD = 0.1;
/** Medium, not High — no Ignore Rules / Approved Differences exist yet (docs/04 requires the
 * Visual Engine to respect both; see README), so legitimately dynamic content (ads, timestamps,
 * rotating banners) isn't filtered and can produce a real-but-expected structural change. SSIM
 * region detection fixed the *anti-aliasing false-positive* problem, but not this separate,
 * still-open ambiguity — so confidence stays in the same band, not higher. */
const CONFIDENCE = 0.75;

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine" | "location"> {
  // Location not yet adopted by this Engine (docs/03: migrated one capability at a time — Links
  // & Images first). A whole-page visual diff doesn't map cleanly onto a single element/selector
  // anyway; its own Location rollout is a question for when this Engine's turn comes.
  return { pageUrl: context.page!.url, engine: "VISUAL", location: null };
}

export const visualEngine: Engine = {
  id: "visual-engine",
  name: "VISUAL",
  version: "0.2.0",
  description:
    "Audit-over-audit regression detection — compares this page's screenshot against the most recent prior audit's screenshot via OpenCV structural similarity (SSIM) and region/contour detection, not raw pixel-diff percentage (docs/04 Visual Engine, docs/08 OpenCV).",
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

    // SSIM + region detection decides *whether* there's a genuine finding (docs/08: OpenCV
    // "structural similarity... region detection... bounding boxes") — see ssim.ts's header for
    // why whole-page mean SSIM alone isn't the right gate (a single changed button is diluted by
    // every unchanged pixel around it) and why region-based detection is what actually filters
    // anti-aliasing/render noise without losing sensitivity to small, real changes.
    const ssimResult = await computeSsim(
      { data: current.data, width: current.width, height: current.height },
      { data: previous.data, width: previous.width, height: previous.height }
    );
    if (ssimResult.changedRegions.length === 0) return [];

    // pixelmatch still renders the highlighted diff image — a human-reviewable visualization,
    // even though SSIM (not raw diffPercent) decides whether this finding exists at all.
    const diff = new PNG({ width, height });
    const diffPixelCount = pixelmatch(current.data, previous.data, diff.data, width, height, {
      threshold: PIXELMATCH_THRESHOLD,
    });
    const diffPercent = (diffPixelCount / (width * height)) * 100;

    const diffImagePath = await uploadEvidence(
      context.auditId,
      context.page!.id,
      "visual-diff",
      PNG.sync.write(diff),
      "image/png"
    );

    const regionCount = ssimResult.changedRegions.length;
    const regionSummary = ssimResult.changedRegions
      .slice(0, 5)
      .map((r) => `(${r.x},${r.y}) ${r.width}x${r.height}px`)
      .join("; ");

    return [
      {
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: CONFIDENCE,
        category: "Visual Regression",
        title: `Visual difference detected (${regionCount} region${regionCount > 1 ? "s" : ""} changed)`,
        description: `This page's screenshot differs structurally from the most recent prior audit's screenshot of it in ${regionCount} distinct region(s): ${regionSummary}. Overall structural similarity: ${(ssimResult.meanSsim * 100).toFixed(1)}%; raw pixel difference: ${diffPercent.toFixed(1)}%.`,
        expectedResult: "This page renders the same as it did in the most recent prior audit.",
        actualResult: `${regionCount} region(s) changed: ${regionSummary}.`,
        businessImpact: "An unreviewed visual change may be an unintended regression, or a deploy that altered the page without sign-off.",
        suggestedResolution: "Review the highlighted diff image and the changed region(s) listed above. If this change was intentional, no action is needed — this audit's screenshot automatically becomes the new baseline for the next one.",
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
