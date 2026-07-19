import type { ActivityEvent, DashboardKpis, EngineHealth } from "@/lib/types";
import { AUDITS } from "./audits";
import { FINDINGS } from "./findings";
import { PROJECTS } from "./projects";

/** Scoped to V1_ENGINES — the rest of the 15-engine catalog isn't built yet (CLAUDE.md Scope Fence). */
export const ENGINE_HEALTH: EngineHealth[] = [
  { engine: "Discovery", status: "healthy" },
  { engine: "UI Validation", status: "healthy" },
  { engine: "Figma", status: "healthy" },
  { engine: "Content", status: "running" },
  { engine: "Functional", status: "healthy" },
  { engine: "Report Generation", status: "healthy" },
];

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: "act-1", type: "audit_completed", message: "Audit Completed", projectName: "Acme Corp Website", timestamp: "2026-07-16T09:44:32Z" },
  { id: "act-2", type: "report_generated", message: "Report Generated", projectName: "Acme Corp Website", timestamp: "2026-07-16T10:01:00Z" },
  { id: "act-3", type: "audit_completed", message: "Audit Failed", projectName: "Northwind Portal", timestamp: "2026-07-15T10:02:10Z" },
  { id: "act-4", type: "project_created", message: "Requirements Uploaded", projectName: "Acme Corp Website", timestamp: "2026-07-14T09:00:00Z" },
  { id: "act-5", type: "audit_completed", message: "Audit Completed", projectName: "Fenwick Docs", timestamp: "2026-07-12T08:09:44Z" },
  { id: "act-6", type: "project_created", message: "Environment Added", projectName: "Acme Corp Website", timestamp: "2026-07-10T09:00:00Z" },
];

/**
 * timeSavedHours and engineAccuracyPercent aren't derivable from other mock entities in this
 * phase (they're external, aggregate metrics a real backend would compute) — hardcoded here.
 * Everything else is derived from the audits/findings mock data so the numbers stay consistent
 * as that data changes.
 */
export function getDashboardKpis(): DashboardKpis {
  const completedAudits = AUDITS.filter((a) => a.status === "completed");
  const runningAudits = AUDITS.filter((a) => a.status === "running");
  const criticalFindings = FINDINGS.filter((f) => f.severity === "critical").length;
  const averageConfidence =
    FINDINGS.reduce((sum, f) => sum + f.confidence, 0) / (FINDINGS.length || 1);
  const averageAuditDurationSeconds =
    completedAudits.reduce((sum, a) => sum + (a.durationSeconds ?? 0), 0) /
    (completedAudits.length || 1);

  return {
    totalProjects: PROJECTS.length,
    runningAudits: runningAudits.length,
    completedAudits: completedAudits.length,
    criticalFindings,
    timeSavedHours: 128,
    averageConfidence,
    averageAuditDurationSeconds,
    engineAccuracyPercent: 96.4,
  };
}
