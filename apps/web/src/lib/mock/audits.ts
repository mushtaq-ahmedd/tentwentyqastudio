import type { Audit, AuditPage, EngineResult } from "@/lib/types";
import { PROJECT_ACME, PROJECT_FENWICK, PROJECT_NORTHWIND } from "./projects";

export const AUDIT_RUNNING = "audit-1042";
export const AUDIT_COMPLETED = "audit-1041";
export const AUDIT_FAILED = "audit-1040";
export const AUDIT_OLDER = "audit-1039";

export const PAGES: AuditPage[] = [
  { id: "page-homepage", auditId: AUDIT_COMPLETED, url: "/", name: "Homepage", status: "validated" },
  { id: "page-pricing", auditId: AUDIT_COMPLETED, url: "/pricing", name: "Pricing", status: "validated" },
  { id: "page-checkout", auditId: AUDIT_COMPLETED, url: "/checkout", name: "Checkout", status: "validated" },
  { id: "page-running-homepage", auditId: AUDIT_RUNNING, url: "/", name: "Homepage", status: "validated" },
  { id: "page-running-pricing", auditId: AUDIT_RUNNING, url: "/pricing", name: "Pricing", status: "pending" },
];

function engineResults(auditId: string, list: Array<Partial<EngineResult> & Pick<EngineResult, "engine" | "status">>): EngineResult[] {
  return list.map((e, i) => ({
    id: `${auditId}-eng-${i}`,
    auditId,
    durationSeconds: null,
    findingsCount: 0,
    errorCount: 0,
    ...e,
  }));
}

export let AUDITS: Audit[] = [
  {
    id: AUDIT_RUNNING,
    runNumber: 1042,
    projectId: PROJECT_ACME,
    projectName: "Acme Corp Website",
    environmentId: "env-acme-qa",
    environmentName: "QA",
    status: "running",
    validationTypes: ["UI Validation", "Figma Comparison", "Grammar Validation"],
    currentEngine: "Content",
    currentActivity: "Comparing homepage with Figma...",
    progressPercent: 72,
    startedAt: "2026-07-17T11:54:00Z",
    endedAt: null,
    durationSeconds: null,
    estimatedPages: 24,
    severityCounts: { critical: 1, high: 0, medium: 1, low: 0 },
    engineResults: engineResults(AUDIT_RUNNING, [
      { engine: "Discovery", status: "completed", durationSeconds: 42 },
      { engine: "UI Validation", status: "completed", durationSeconds: 63, findingsCount: 1 },
      // "Grammar Validation" is a ValidationType, not a separate Engine — the Content Engine
      // covers it (docs/04), so there's one Content row, not two.
      { engine: "Content", status: "running" },
      { engine: "Report Generation", status: "waiting" },
    ]),
  },
  {
    id: AUDIT_COMPLETED,
    runNumber: 1041,
    projectId: PROJECT_ACME,
    projectName: "Acme Corp Website",
    environmentId: "env-acme-staging",
    environmentName: "Staging",
    status: "completed",
    validationTypes: ["UI Validation", "Figma Comparison", "Content Validation", "Functional Validation"],
    currentEngine: null,
    currentActivity: null,
    progressPercent: 100,
    startedAt: "2026-07-16T09:30:00Z",
    endedAt: "2026-07-16T09:44:32Z",
    durationSeconds: 872,
    estimatedPages: 24,
    severityCounts: { critical: 3, high: 8, medium: 14, low: 6 },
    engineResults: engineResults(AUDIT_COMPLETED, [
      { engine: "Discovery", status: "completed", durationSeconds: 38, findingsCount: 0 },
      { engine: "UI Validation", status: "completed", durationSeconds: 210, findingsCount: 2 },
      { engine: "Content", status: "completed", durationSeconds: 180, findingsCount: 1 },
      { engine: "Functional", status: "completed", durationSeconds: 240, findingsCount: 1 },
      { engine: "Report Generation", status: "completed", durationSeconds: 12 },
    ]),
  },
  {
    id: AUDIT_FAILED,
    runNumber: 1040,
    projectId: PROJECT_NORTHWIND,
    projectName: "Northwind Portal",
    environmentId: "env-northwind-prod",
    environmentName: "Production",
    status: "failed",
    validationTypes: ["UI Validation"],
    currentEngine: null,
    currentActivity: null,
    progressPercent: 18,
    startedAt: "2026-07-15T10:00:00Z",
    endedAt: "2026-07-15T10:02:10Z",
    durationSeconds: 130,
    estimatedPages: 16,
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    engineResults: engineResults(AUDIT_FAILED, [
      { engine: "Discovery", status: "completed", durationSeconds: 22 },
      { engine: "UI Validation", status: "failed", errorCount: 1 },
    ]),
  },
  {
    id: AUDIT_OLDER,
    runNumber: 1039,
    projectId: PROJECT_FENWICK,
    projectName: "Fenwick Docs",
    environmentId: "env-fenwick-staging",
    environmentName: "Staging",
    status: "completed",
    validationTypes: ["UI Validation", "Content Validation"],
    currentEngine: null,
    currentActivity: null,
    progressPercent: 100,
    startedAt: "2026-07-12T08:00:00Z",
    endedAt: "2026-07-12T08:09:44Z",
    durationSeconds: 584,
    estimatedPages: 10,
    severityCounts: { critical: 0, high: 1, medium: 1, low: 0 },
    engineResults: engineResults(AUDIT_OLDER, [
      { engine: "Discovery", status: "completed", durationSeconds: 20 },
      { engine: "UI Validation", status: "completed", durationSeconds: 300, findingsCount: 1 },
      { engine: "Content", status: "completed", durationSeconds: 180, findingsCount: 1 },
    ]),
  },
];

export function cancelAudit(auditId: string) {
  AUDITS = AUDITS.map((a) =>
    a.id === auditId ? { ...a, status: "cancelled" as const, currentEngine: null, currentActivity: null } : a
  );
}
