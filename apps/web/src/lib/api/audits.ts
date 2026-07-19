import { prisma } from "@tentwenty/db";
import { runAudit as runAuditOrchestrator } from "@tentwenty/core";
// instrumentation.ts's register() runs in a separate module graph than Server Actions in
// Turbopack dev mode — the Engine Registry singleton it populates isn't visible here. Importing
// directly guarantees this specific bundle has engines registered before runAudit() is called.
import "@/lib/engines/register";
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
 * Creates the audit, then runs the Orchestrator (docs/03) in-process before returning — see
 * packages/core/src/orchestrator.ts for why this is synchronous rather than a queued
 * background job for now. Only Discovery is actually implemented as of this pass; every other
 * selected validation type's engine stays WAITING, and the Orchestrator leaves the audit
 * honestly RUNNING (not a faked COMPLETED) until those engines exist.
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
    // Element Matching isn't a user-selectable ValidationType (docs/09) — it's the prerequisite
    // step Figma Comparison needs (docs/04 "do not skip element matching to go straight to pixel
    // diffing"), so it rides along whenever Figma Comparison was selected.
    if (engineNames.includes("FIGMA") && !engineNames.includes("ELEMENT_MATCHING")) {
      engineNames.push("ELEMENT_MATCHING");
    }

    const created = await prisma.audit.create({
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
            // Every page-scoped Validation engine depends on Browser having rendered the page
            // first, so it always runs once any page-level validation type is selected — same
            // "always included" treatment as Discovery/Report, not user-selectable.
            { engine: "BROWSER", status: "WAITING" },
            ...engineNames.map((engine) => ({ engine: engine as never, status: "WAITING" as const })),
            { engine: "REPORT", status: "WAITING" },
          ],
        },
      },
    });

    await runAuditOrchestrator(created.id);

    const audit = await prisma.audit.findUniqueOrThrow({ where: { id: created.id }, include: AUDIT_INCLUDE });
    return ok(toAudit(audit as AuditWithRelations), "Audit started.");
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
