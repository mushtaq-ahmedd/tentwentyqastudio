import { prisma } from "@tentwenty/db";
import { downloadEvidenceText, getSignedEvidenceUrl } from "@tentwenty/core";
import type { ApiResponse, Finding, FindingStatus, Severity } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toFinding, type FindingWithEvidence } from "./mappers";

/**
 * Evidence.content is a real object-storage path once an Engine has actually run (docs/05) — not
 * displayable as-is. Resolves each finding's evidence in place: screenshots become short-lived
 * signed URLs (frontend renders an <img>), everything else is downloaded as text (frontend
 * renders a <pre>). Falls back to the raw stored value on failure rather than breaking the whole
 * findings page — covers seed/mock evidence rows that were never real storage paths to begin
 * with, and any object that's since been deleted from the bucket.
 */
async function resolveEvidenceContent(findings: Finding[]): Promise<Finding[]> {
  // Every evidence item is its own Supabase Storage round trip (sign a URL, or download text) —
  // resolving them one at a time made a findings page with a few hundred evidence rows take
  // 30-60+ seconds (live-observed). None of these calls depend on each other, so they all run
  // concurrently instead; a single slow/failed one still falls back to the raw value below rather
  // than blocking or breaking the rest.
  const allEvidence = findings.flatMap((f) => f.evidence);
  await Promise.all(
    allEvidence.map(async (evidence) => {
      try {
        evidence.content =
          evidence.type === "screenshot"
            ? await getSignedEvidenceUrl(evidence.content)
            : await downloadEvidenceText(evidence.content);
      } catch {
        // Not a real storage path (mock/seed data) or the object is gone — show the raw value.
      }
    })
  );
  return findings;
}

const SEVERITY_TO_DB: Record<Severity, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const STATUS_TO_DB: Record<FindingStatus, string> = {
  new: "NEW",
  reviewed: "REVIEWED",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  ignored: "IGNORED",
};

export type FindingFilter = {
  projectId?: string;
  auditId?: string;
  severity?: Severity;
  status?: FindingStatus;
};

export async function fetchFindings(filter: FindingFilter = {}): Promise<ApiResponse<Finding[]>> {
  return guarded(async () => {
    await requireUser();
    const findings = await prisma.finding.findMany({
      where: {
        projectId: filter.projectId,
        auditId: filter.auditId,
        severity: filter.severity ? (SEVERITY_TO_DB[filter.severity] as never) : undefined,
        status: filter.status ? (STATUS_TO_DB[filter.status] as never) : undefined,
      },
      include: { evidence: true, page: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(await resolveEvidenceContent(findings.map((f) => toFinding(f as FindingWithEvidence))));
  });
}

export async function fetchFinding(findingId: string): Promise<ApiResponse<Finding>> {
  return guarded(async () => {
    await requireUser();
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: { evidence: true, page: { select: { name: true } } },
    });
    if (!finding) return fail("FINDING_NOT_FOUND", "Finding does not exist.");
    const [resolved] = await resolveEvidenceContent([toFinding(finding as FindingWithEvidence)]);
    return ok(resolved);
  });
}

export async function setFindingStatus(
  findingId: string,
  status: FindingStatus
): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.finding.update({ where: { id: findingId }, data: { status: STATUS_TO_DB[status] as never } });
    return ok(null, `Finding marked as ${status}.`);
  });
}

export async function bulkSetFindingStatus(
  findingIds: string[],
  status: FindingStatus
): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.finding.updateMany({
      where: { id: { in: findingIds } },
      data: { status: STATUS_TO_DB[status] as never },
    });
    return ok(null, `${findingIds.length} findings marked as ${status}.`);
  });
}

export async function deleteFindings(findingIds: string[]): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.finding.deleteMany({ where: { id: { in: findingIds } } });
    return ok(null, `${findingIds.length} findings deleted.`);
  });
}

/** Clears every finding matching the current filter — not just the selected rows on the current
 * page. `projectId` undefined means "no project filter," i.e. every finding in the system, same
 * "undefined = no constraint on this field" convention as `fetchFindings` above. */
export async function deleteAllFindings(filter: { projectId?: string } = {}): Promise<ApiResponse<{ count: number }>> {
  return guarded(async () => {
    await requireNotViewer();
    const { count } = await prisma.finding.deleteMany({ where: { projectId: filter.projectId } });
    return ok({ count }, `${count} finding(s) cleared.`);
  });
}
