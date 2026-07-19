import type { EngineName, Severity } from "./common";

/**
 * Finding schema.
 *
 * docs/05-database-and-api.md describes the `findings` table only at the column-purpose
 * level (engine, severity, confidence, title, description, expected/actual result, status —
 * belongs to exactly one page and one audit) with no formal field types or enums. This
 * interface is derived from that description plus what html design files/pages/findings.js
 * actually renders (which adds `businessImpact` and `suggestedResolution` beyond doc 05's
 * list). Flagging per docs/10's "don't guess silently" rule rather than treating this as
 * settled — confirm against the real Engine Result / Finding contract in docs/03 once the
 * engines exist.
 */
export type FindingStatus = "new" | "reviewed" | "accepted" | "rejected" | "ignored";

export type ConfidenceLabel = "Very High" | "High" | "Medium" | "Low";

export type EvidenceType = "screenshot" | "dom" | "html" | "css" | "console";

export type Evidence = {
  id: string;
  findingId: string;
  type: EvidenceType;
  /** Object storage path in production (docs/05: evidence is metadata-only, files live outside Postgres). Mock data inlines content directly. */
  content: string;
};

export type Finding = {
  id: string;
  auditId: string;
  pageId: string;
  pageName: string;
  projectId: string;
  engine: EngineName;
  severity: Severity;
  /** 0-1. The HTML prototype displays this as a rounded percentage string ("99%"). */
  confidence: number;
  title: string;
  expectedResult: string;
  actualResult: string;
  businessImpact: string;
  suggestedResolution: string;
  status: FindingStatus;
  evidence: Evidence[];
  createdAt: string;
};

/**
 * Confidence-label thresholds are placeholders — docs/07-accuracy-benchmark.md (not read in
 * this pass) is the actual source of truth for Very High / High / Medium / Low cutoffs per
 * CLAUDE.md's Quality Bar. Replace these once doc 07 is consulted.
 */
export function confidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.95) return "Very High";
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.65) return "Medium";
  return "Low";
}
