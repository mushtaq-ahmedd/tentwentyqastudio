import { prisma } from "@tentwenty/db";
import type { ApiResponse, Audit, ValidationType } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toAudit, type AuditWithRelations } from "./mappers";

const VALIDATION_TYPE_TO_DB: Record<ValidationType, string> = {
  "UI Validation": "UI_VALIDATION",
  "Figma Comparison": "FIGMA_COMPARISON",
  "Content Validation": "CONTENT_VALIDATION",
  "Grammar Validation": "GRAMMAR_VALIDATION",
  "Functional Validation": "FUNCTIONAL_VALIDATION",
};

/** Which Engine (docs/04) actually executes each user-facing ValidationType (docs/09). Grammar
 * Validation and Content Validation both route to the Content Engine — it's not a separate one. */
const VALIDATION_TYPE_TO_ENGINE: Record<ValidationType, string> = {
  "UI Validation": "UI_VALIDATION",
  "Figma Comparison": "FIGMA",
  "Content Validation": "CONTENT",
  "Grammar Validation": "CONTENT",
  "Functional Validation": "FUNCTIONAL",
};

const AUDIT_INCLUDE = {
  project: true,
  environment: true,
  engineResults: true,
  findings: { select: { severity: true as const } },
};

export async function fetchAudits(): Promise<ApiResponse<Audit[]>> {
  return guarded(async () => {
    await requireUser();
    const audits = await prisma.audit.findMany({
      include: AUDIT_INCLUDE,
      orderBy: { startedAt: "desc" },
    });
    return ok(audits.map((a) => toAudit(a as AuditWithRelations)));
  });
}

export async function fetchAudit(auditId: string): Promise<ApiResponse<Audit>> {
  return guarded(async () => {
    await requireUser();
    const audit = await prisma.audit.findUnique({ where: { id: auditId }, include: AUDIT_INCLUDE });
    if (!audit) return fail("AUDIT_NOT_FOUND", "Audit does not exist.");
    return ok(toAudit(audit as AuditWithRelations));
  });
}

/** The one audit currently running, if any — powers the persistent header pill. */
export async function fetchActiveAudit(): Promise<ApiResponse<Audit | null>> {
  return guarded(async () => {
    const audit = await prisma.audit.findFirst({
      where: { status: "RUNNING" },
      include: AUDIT_INCLUDE,
      orderBy: { startedAt: "desc" },
    });
    return ok(audit ? toAudit(audit as AuditWithRelations) : null);
  });
}

/**
 * Creates a real, honest QUEUED audit — no Engine Orchestrator exists yet (docs/03, Phase B+
 * of the backend plan), so this does not simulate progress the way the old mock layer did.
 * Every selected validation type's underlying engine (docs/04) starts in WAITING status.
 */
export async function startAudit(input: {
  projectId: string;
  environmentId: string;
  validationTypes: ValidationType[];
}): Promise<ApiResponse<Audit>> {
  return guarded(async () => {
    const user = await requireNotViewer();
    if (input.validationTypes.length === 0) {
      return fail("VALIDATION_ERROR", "Select at least one validation type.");
    }

    const engineNames = Array.from(
      new Set(input.validationTypes.map((v) => VALIDATION_TYPE_TO_ENGINE[v]))
    );

    const audit = await prisma.audit.create({
      data: {
        projectId: input.projectId,
        environmentId: input.environmentId,
        status: "QUEUED",
        validationTypes: input.validationTypes.map((v) => VALIDATION_TYPE_TO_DB[v]) as never,
        startedById: user.id,
        progressPercent: 0,
        engineResults: {
          create: [
            { engine: "DISCOVERY", status: "WAITING" },
            ...engineNames.map((engine) => ({ engine: engine as never, status: "WAITING" as const })),
            { engine: "REPORT", status: "WAITING" },
          ],
        },
      },
      include: AUDIT_INCLUDE,
    });

    return ok(toAudit(audit as AuditWithRelations), "Audit queued.");
  });
}

export async function cancelAudit(auditId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "CANCELLED", currentEngine: null, currentActivity: null },
    });
    return ok(null, "Audit cancelled.");
  });
}
