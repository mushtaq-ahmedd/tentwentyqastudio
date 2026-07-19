import { prisma } from "@tentwenty/db";
import type { ApiResponse, Finding, FindingStatus, Severity } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toFinding, type FindingWithEvidence } from "./mappers";

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
    return ok(findings.map((f) => toFinding(f as FindingWithEvidence)));
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
    return ok(toFinding(finding as FindingWithEvidence));
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
