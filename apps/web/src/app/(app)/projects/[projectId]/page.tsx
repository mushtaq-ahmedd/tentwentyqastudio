import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { auditsApi, dashboardApi, findingsApi, projectsApi } from "@/lib/api";
import { formatDurationSeconds, formatRelativeTime } from "@/lib/format";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [projectRes, findingsRes, auditsRes] = await Promise.all([
    projectsApi.fetchProject(projectId),
    findingsApi.fetchFindings({ projectId }),
    auditsApi.fetchAudits(),
  ]);
  if (!projectRes.success) notFound();
  const project = projectRes.data;
  const findings = findingsRes.success ? findingsRes.data : [];
  const projectAudits = auditsRes.success ? auditsRes.data.filter((a) => a.projectId === projectId) : [];
  const latestAudit = projectAudits[0] ?? null;
  const activityRes = await dashboardApi.fetchProjectActivity(project.name);
  const activity = activityRes.success ? activityRes.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>Project Summary</CardTitle>
          <CardContent className="flex flex-col gap-2 text-[13px]">
            <div className="flex justify-between"><span className="text-text-secondary">Environments</span><span className="font-mono-tabular font-mono">{project.environmentsCount}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Latest Audit</span><span>{project.lastAuditAt ? formatRelativeTime(project.lastAuditAt) : "Never"}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Total Findings</span><span className="font-mono-tabular font-mono">{project.totalFindings}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Critical Findings</span><span className="font-mono-tabular font-mono text-error-default">{project.criticalFindings}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Last Report</span><span>{project.lastReportAt ? formatRelativeTime(project.lastReportAt) : "—"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Latest Audit</CardTitle>
          <CardContent>
            {latestAudit ? (
              <>
                <div className="mb-2.5 flex items-center justify-between">
                  <Badge variant={latestAudit.status === "failed" ? "critical" : latestAudit.status === "completed" ? "accepted" : "medium"}>
                    {latestAudit.status[0].toUpperCase() + latestAudit.status.slice(1)}
                  </Badge>
                  <span className="font-mono-tabular font-mono text-xs text-text-secondary">
                    {formatDurationSeconds(latestAudit.durationSeconds)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    render={<Link href={`/audit-center/summary/${latestAudit.id}`} />}
                    nativeButton={false}
                    className="flex-1 justify-center"
                  >
                    Open Audit
                  </Button>
                  <Button variant="secondary" render={<Link href="/reports" />} nativeButton={false} className="flex-1 justify-center">
                    Open Report
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState title="No audits yet" description="Run your first audit to begin validating this project." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="mb-3.5 flex items-center justify-between">
          <CardTitle>Recent Findings</CardTitle>
          <Link href="/findings" className="text-xs font-medium text-accent-default hover:underline">View All</Link>
        </div>
        <CardContent className="flex flex-col">
          {findings.length === 0 ? (
            <EmptyState title="No findings yet" description="Findings will appear here once an audit runs." />
          ) : (
            findings.slice(0, 2).map((f) => (
              <div key={f.id} className="flex items-center gap-2.5 border-b border-border-default py-3 last:border-0">
                <span className={`w-[3px] shrink-0 self-stretch rounded-sm ${
                  f.severity === "critical" ? "bg-error-default" : f.severity === "high" ? "bg-warning-default" : f.severity === "medium" ? "bg-info-default" : "bg-border-strong"
                }`} />
                <Badge variant={f.severity}>{f.severity[0].toUpperCase() + f.severity.slice(1)}</Badge>
                <span className="flex-1 font-medium">{f.title}</span>
                <span className="text-xs text-text-secondary">{f.engine}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Project Activity</CardTitle>
        <CardContent className="flex flex-col gap-2.5 text-[13px]">
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Project activity will show up here as things happen." />
          ) : (
            activity.map((event) => (
              <div key={event.id} className="flex justify-between">
                <span>{event.message}</span>
                <span className="text-text-secondary">{formatRelativeTime(event.timestamp)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
