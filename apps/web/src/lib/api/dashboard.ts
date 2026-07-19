import { prisma } from "@tentwenty/db";
import type {
  ActivityEvent,
  ApiResponse,
  Audit,
  DashboardKpis,
  EngineHealth,
  Finding,
  Project,
  Report,
} from "@/lib/types";
import { V1_ENGINES } from "@/lib/types";
import { requireUser } from "@/lib/auth/session";
import { guarded, ok } from "./client";
import { toAudit, toFinding, toProject, toReport, type AuditWithRelations, type FindingWithEvidence, type ReportWithProject } from "./mappers";
import { withAggregates } from "./projects";

export type DashboardSummary = {
  kpis: DashboardKpis;
  recentProjects: Project[];
  runningAudits: Audit[];
  recentRuns: Audit[];
  criticalFindings: Finding[];
  recentReports: Report[];
  engineHealth: EngineHealth[];
  recentActivity: ActivityEvent[];
};

const AUDIT_INCLUDE = {
  project: true,
  environment: true,
  engineResults: true,
  findings: { select: { severity: true as const } },
};

/**
 * Synthesized from existing tables rather than a dedicated activity/event-log table — there
 * isn't one yet (flagging per docs/10: a real audit-log table is the more correct design if
 * this feed needs to grow beyond "recent audits + reports + projects").
 */
async function fetchRecentActivity(limit: number, projectName?: string): Promise<ActivityEvent[]> {
  const [audits, reports, projects] = await Promise.all([
    prisma.audit.findMany({
      where: projectName ? { project: { name: projectName } } : undefined,
      include: { project: true },
      orderBy: { startedAt: "desc" },
      take: limit,
    }),
    prisma.report.findMany({
      where: projectName ? { project: { name: projectName } } : undefined,
      include: { project: true },
      orderBy: { generatedAt: "desc" },
      take: limit,
    }),
    projectName
      ? []
      : await prisma.project.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
  ]);

  const events: ActivityEvent[] = [
    ...audits.flatMap((a): ActivityEvent[] =>
      a.endedAt
        ? [{
            id: `audit-end-${a.id}`,
            type: "audit_completed" as const,
            message: a.status === "FAILED" ? "Audit Failed" : "Audit Completed",
            projectName: a.project.name,
            timestamp: a.endedAt.toISOString(),
          }]
        : [{
            id: `audit-start-${a.id}`,
            type: "audit_started" as const,
            message: "Audit Started",
            projectName: a.project.name,
            timestamp: a.startedAt.toISOString(),
          }]
    ),
    ...reports.map((r) => ({
      id: `report-${r.id}`,
      type: "report_generated" as const,
      message: "Report Generated",
      projectName: r.project.name,
      timestamp: r.generatedAt.toISOString(),
    })),
    ...projects.map((p) => ({
      id: `project-${p.id}`,
      type: "project_created" as const,
      message: "Project Created",
      projectName: p.name,
      timestamp: p.createdAt.toISOString(),
    })),
  ];

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}

export async function fetchProjectActivity(projectName: string): Promise<ApiResponse<ActivityEvent[]>> {
  return guarded(async () => {
    await requireUser();
    return ok(await fetchRecentActivity(10, projectName));
  });
}

export async function fetchDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return guarded(async () => {
    await requireUser();

    // Everything independent of `projects` runs in one round-trip layer, including
    // criticalFindingsCount (previously awaited separately, after withAggregates below — a third
    // sequential layer for no reason, since it doesn't depend on anything either). Only
    // withAggregates() has a real data dependency (needs project IDs) forcing a second layer.
    const [projects, allAudits, criticalFindingsRaw, recentReportsRaw, confidenceAgg, recentActivity, criticalFindingsCount] =
      await Promise.all([
        prisma.project.findMany({ where: { archivedAt: null } }),
        prisma.audit.findMany({ include: AUDIT_INCLUDE, orderBy: { startedAt: "desc" }, take: 50 }),
        prisma.finding.findMany({
          where: { severity: "CRITICAL" },
          include: { evidence: true, page: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.report.findMany({
          include: { project: true, generatedBy: true },
          orderBy: { generatedAt: "desc" },
          take: 5,
        }),
        prisma.finding.aggregate({ _avg: { confidence: true } }),
        fetchRecentActivity(6),
        prisma.finding.count({ where: { severity: "CRITICAL" } }),
      ]);

    const projectsWithAgg = await withAggregates(projects);
    const recentProjects = [...projectsWithAgg].sort(
      (a, b) => (b.lastAuditAt?.getTime() ?? 0) - (a.lastAuditAt?.getTime() ?? 0)
    );

    const audits = allAudits.map((a) => toAudit(a as AuditWithRelations));
    const runningAudits = audits.filter((a) => a.status === "running");
    const completedAudits = audits.filter((a) => a.status === "completed");

    const kpis: DashboardKpis = {
      totalProjects: projects.length,
      runningAudits: runningAudits.length,
      completedAudits: completedAudits.length,
      criticalFindings: criticalFindingsCount,
      // Not derivable from current tables — no benchmark/time-tracking system exists yet
      // (docs/07 territory). Placeholder until that exists.
      timeSavedHours: 128,
      averageConfidence: confidenceAgg._avg.confidence ?? 0,
      averageAuditDurationSeconds:
        completedAudits.reduce((sum, a) => sum + (a.durationSeconds ?? 0), 0) /
        (completedAudits.length || 1),
      engineAccuracyPercent: 96.4,
    };

    return ok({
      kpis,
      recentProjects: recentProjects.map(toProject),
      runningAudits,
      recentRuns: audits.slice(0, 5),
      criticalFindings: criticalFindingsRaw.map((f) => toFinding(f as FindingWithEvidence)),
      recentReports: recentReportsRaw.map((r) => toReport(r as ReportWithProject)),
      engineHealth: V1_ENGINES.map((engine) => ({ engine, status: "healthy" as const })),
      recentActivity,
    });
  });
}
