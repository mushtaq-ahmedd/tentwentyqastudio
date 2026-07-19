import { prisma } from "@tentwenty/db";
import { registerEngine, type Engine, type EngineContext } from "@tentwenty/core";

/** Small, deliberately conservative bonuses — see the README for why these two signals (and not
 * others) were chosen, and why this only ever raises a score, never lowers one. */
const EVIDENCE_BONUS = 0.02;
const RECURRENCE_BONUS = 0.03;
const EVIDENCE_COMPLETENESS_THRESHOLD = 2;
/** Never claim absolute certainty, even after bonuses. */
const MAX_CONFIDENCE = 0.99;

export const confidenceEngine: Engine = {
  id: "confidence-engine",
  name: "CONFIDENCE",
  version: "0.1.0",
  description:
    "Blends each Validation engine's own initial confidence score into a final one, using signals no single engine can see on its own — evidence completeness and cross-audit recurrence (docs/03 Confidence Model).",
  // Every current engine that actually writes Findings — Processing-category engines that don't
  // (Discovery/Browser/Figma/Element Matching) aren't listed; there's nothing of theirs to blend.
  dependencies: ["content-engine", "functional-engine", "ui-validation-engine"],
  supportedValidationTypes: [],
  scope: "audit",

  async initialize(context: EngineContext) {
    const findings = await prisma.finding.findMany({
      where: { auditId: context.auditId },
      include: { evidence: true },
    });

    for (const finding of findings) {
      let blended = finding.confidence;

      // Signal 1: evidence completeness — a claim backed by more than one piece of evidence
      // (e.g. a screenshot *and* a DOM/network-log excerpt) is better-supported than a bare one.
      if (finding.evidence.length >= EVIDENCE_COMPLETENESS_THRESHOLD) {
        blended += EVIDENCE_BONUS;
      }

      // Signal 2: cross-audit recurrence — has this project seen this same category of issue
      // from this same engine before, in a *different* audit? A single Validation engine run has
      // no visibility into audit history; only something operating across the whole Finding
      // table (this engine) can see it. Category-level, not exact-title, since titles embed
      // dynamic counts ("3 broken links found") that differ run to run for the same real issue.
      const priorOccurrence = await prisma.finding.findFirst({
        where: {
          projectId: context.projectId,
          engine: finding.engine,
          category: finding.category,
          auditId: { not: context.auditId },
        },
        select: { id: true },
      });
      if (priorOccurrence) blended += RECURRENCE_BONUS;

      blended = Math.min(blended, MAX_CONFIDENCE);
      if (blended !== finding.confidence) {
        await prisma.finding.update({ where: { id: finding.id }, data: { confidence: blended } });
      }
    }
  },

  async validate() {
    return []; // Processing engine — adjusts existing Findings above, never creates its own.
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — never produces its own findings to score.
  },

  async cleanup() {
    // Nothing to tear down.
  },
};

registerEngine(confidenceEngine);
