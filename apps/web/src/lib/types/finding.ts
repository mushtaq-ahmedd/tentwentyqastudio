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

export type EvidenceType = "screenshot" | "highlighted_screenshot" | "dom" | "html" | "css" | "console";

export type Evidence = {
  id: string;
  findingId: string;
  type: EvidenceType;
  /** Object storage path in production (docs/05: evidence is metadata-only, files live outside Postgres). Mock data inlines content directly. */
  content: string;
};

/** A precise on-page pointer — mandatory going forward per CLAUDE.md's Location rule, captured
 * by the detecting Engine itself (docs/03). `null` for findings from an Engine that hasn't
 * adopted this yet (migrated one capability at a time — see docs/03's Links & Images note). */
export type FindingLocation = {
  selector: string | null;
  textSnippet: string | null;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
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
  /** AI Engine output (docs/06) — a human-readable narrative generated from this finding's own
   * fields; never alters them. Null if no AI provider is configured, or its call failed for this
   * finding (docs/06: "AI failure must never block report generation"). */
  aiExplanation: string | null;
  status: FindingStatus;
  location: FindingLocation | null;
  evidence: Evidence[];
  createdAt: string;
};

/** Thresholds per docs/07-accuracy-benchmark.md: 95-100% Very High, 85-94% High, 70-84% Medium,
 * below 70% Low. */
export function confidenceLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 0.95) return "Very High";
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
}
