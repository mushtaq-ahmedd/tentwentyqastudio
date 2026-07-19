import Link from "next/link";
import { Play } from "lucide-react";
import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { dashboardApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import type { AuditStatus, ProjectStatus } from "@/lib/types";

const PROJECT_STATUS_CHIP: Record<ProjectStatus, "completed" | "failed" | "running"> = {
  ready: "completed",
  "not-ready": "failed",
  "ready-with-warnings": "running",
};

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  ready: "Ready",
  "not-ready": "Not Ready",
  "ready-with-warnings": "Ready with Warnings",
};

const AUDIT_STATUS_CHIP: Record<AuditStatus, "completed" | "failed" | "running" | "queued"> = {
  completed: "completed",
  failed: "failed",
  running: "running",
  cancelled: "failed",
  queued: "queued",
};

export default async function DashboardPage() {
  const res = await dashboardApi.fetchDashboardSummary();
  if (!res.success) throw new Error(res.error.message);
  const { kpis, recentProjects, runningAudits, recentRuns, criticalFindings, recentReports, engineHealth, recentActivity } = res.data;

  const primaryProject = recentProjects[0] ?? null;

  if (recentProjects.length === 0) {
    return (
      <>
        <SetHeader title="Dashboard" />
        <div className="mx-auto mt-10 max-w-[520px]">
          <EmptyState
            title="Create your first project"
            description="Add a project and testing environment to start running audits."
            action={
              <Link href="/projects" className="text-sm font-medium text-accent-default hover:underline">
                Go to Projects
              </Link>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SetHeader
        title="Dashboard"
        pills={primaryProject ? [{ label: primaryProject.name }] : []}
        action={{ label: "Run Audit", icon: <Play className="size-3.5" />, href: "/audit-center" }}
      />

      <KpiGrid kpis={kpis} />

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link href="/projects" className="text-xs font-medium text-accent-default hover:underline">View All</Link>
          </div>
          <CardContent className="flex flex-col">
            {recentProjects.slice(0, 4).map((project) => (
              <div key={project.id} className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{project.name}</div>
                  <div className="text-xs text-text-secondary">
                    {project.environmentsCount} environments · Updated{" "}
                    {project.lastAuditAt ? formatRelativeTime(project.lastAuditAt) : "never"}
                  </div>
                </div>
                <StatusChip variant={PROJECT_STATUS_CHIP[project.status]}>
                  {PROJECT_STATUS_LABEL[project.status]}
                </StatusChip>
                <Link href={`/projects/${project.id}`} className="text-xs font-medium text-accent-default hover:underline">
                  Open
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <CardTitle>Running Audits</CardTitle>
            <Link href="/audit-center" className="text-xs font-medium text-accent-default hover:underline">View All</Link>
          </div>
          <CardContent>
            {runningAudits.length === 0 ? (
              <EmptyState
                title="No audits running"
                description="Start an audit from the Audit Center to see live progress here."
              />
            ) : (
              runningAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="status-dot-live relative inline-block size-1.5 rounded-full bg-info-default" />
                      <span className="font-medium">{audit.projectName} — {audit.environmentName}</span>
                    </div>
                    <div className="font-mono-tabular mt-1 mb-2 font-mono text-xs text-text-secondary">
                      {audit.currentEngine} · running
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-surface-secondary">
                      <div className="h-full rounded-full bg-accent-default transition-all" style={{ width: `${audit.progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="font-mono-tabular font-mono text-[15px] font-semibold">{audit.progressPercent}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <CardTitle>Critical Findings</CardTitle>
            <Link href="/findings" className="text-xs font-medium text-accent-default hover:underline">View All</Link>
          </div>
          <CardContent className="flex flex-col">
            {criticalFindings.length === 0 ? (
              <EmptyState title="No critical findings" description="Nothing needs urgent attention right now." />
            ) : (
              criticalFindings.map((finding) => (
                <Link
                  key={finding.id}
                  href={`/findings?findingId=${finding.id}`}
                  className="flex items-center gap-2.5 border-b border-border-default py-3 last:border-0"
                >
                  <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-error-default" />
                  <Badge variant="critical">Critical</Badge>
                  <span className="flex-1 truncate font-medium">{finding.title}</span>
                  <span className="shrink-0 text-xs text-text-secondary">{finding.pageName} · {finding.engine}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <QuickActionsCard
          latestReportHref="/reports"
          latestFindingsHref="/findings"
          primaryProjectId={primaryProject?.id ?? null}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
            <Link href="/reports" className="text-xs font-medium text-accent-default hover:underline">View All</Link>
          </div>
          <CardContent className="flex flex-col">
            {recentReports.length === 0 ? (
              <EmptyState title="No reports yet" description="Reports appear here once an audit finishes." />
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between gap-3 border-b border-border-default py-3 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{report.title}</div>
                    <div className="text-xs text-text-secondary">
                      {report.projectName} · {formatRelativeTime(report.generatedAt)}
                    </div>
                  </div>
                  <Link href="/reports" className="shrink-0 text-xs font-medium text-accent-default hover:underline">View</Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Engine Health</CardTitle>
          <CardContent className="flex flex-col">
            {engineHealth.map((eh) => (
              <div key={eh.engine} className="flex items-center justify-between border-b border-border-default py-2.5 last:border-0">
                <span className="text-[13px]">{eh.engine}</span>
                <StatusChip
                  variant={
                    eh.status === "healthy" || eh.status === "completed"
                      ? "completed"
                      : eh.status === "running"
                        ? "running"
                        : eh.status === "failed"
                          ? "failed"
                          : "queued"
                  }
                >
                  {eh.status === "healthy" ? "Healthy" : eh.status[0].toUpperCase() + eh.status.slice(1)}
                </StatusChip>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="mb-3.5 flex items-center justify-between">
          <CardTitle>Recent Runs</CardTitle>
          <Link href="/history" className="text-xs font-medium text-accent-default hover:underline">View All Runs</Link>
        </div>
        <CardContent>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-default text-[11px] font-medium tracking-[0.04em] text-text-secondary uppercase">
                <th className="pb-2.5 text-left">Run ID</th>
                <th className="pb-2.5 text-left">Project</th>
                <th className="pb-2.5 text-left">Environment</th>
                <th className="pb-2.5 text-left">Status</th>
                <th className="pb-2.5 text-left">Started</th>
                <th className="pb-2.5 text-left">Findings</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((audit) => (
                <tr key={audit.id} className="border-b border-border-default last:border-0 hover:bg-bg-surface-secondary">
                  <td className="py-3">
                    <Link
                      href={audit.status === "running" ? `/audit-center/live/${audit.id}` : `/audit-center/summary/${audit.id}`}
                      className="font-mono-tabular font-mono hover:underline"
                    >
                      #{audit.runNumber}
                    </Link>
                  </td>
                  <td className="py-3">{audit.projectName}</td>
                  <td className="py-3">{audit.environmentName}</td>
                  <td className="py-3">
                    <StatusChip variant={AUDIT_STATUS_CHIP[audit.status]}>
                      {audit.status[0].toUpperCase() + audit.status.slice(1)}
                    </StatusChip>
                  </td>
                  <td className="py-3 text-text-secondary">{formatRelativeTime(audit.startedAt)}</td>
                  <td className="font-mono-tabular py-3 font-mono">
                    {Object.values(audit.severityCounts).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Recent Activity</CardTitle>
        <CardContent className="flex flex-col gap-2.5 text-[13px]">
          {recentActivity.map((event) => (
            <div key={event.id} className="flex items-center justify-between">
              <span>{event.message} <span className="text-text-secondary">· {event.projectName}</span></span>
              <span className="text-text-secondary">{formatRelativeTime(event.timestamp)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
