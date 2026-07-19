"use client";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDurationSeconds } from "@/lib/format";
import type { Audit, Finding, Report, ReportType } from "@/lib/types";

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export function ReportsView({
  audit,
  findings,
  reports,
}: {
  audit: Audit | null;
  findings: Finding[];
  reports: Report[];
}) {
  if (!audit) {
    return (
      <EmptyState
        title="No reports yet"
        description="Reports are generated automatically once an audit completes. Run your first audit to see one here."
      />
    );
  }

  return (
    <Tabs defaultValue="developer">
      <TabsList>
        <TabsTrigger value="developer">Developer Report</TabsTrigger>
        <TabsTrigger value="management">Management Report</TabsTrigger>
        <TabsTrigger value="executive">Executive Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="developer">
        <Card>
          <CardTitle>Developer Report — {audit.projectName}</CardTitle>
          <CardContent>
            <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">Severity Distribution</div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              {SEVERITIES.map((sev) => (
                <div key={sev}>
                  <span className={`font-mono-tabular block font-mono text-[21px] font-semibold ${
                    sev === "critical" ? "text-error-default" : sev === "high" ? "text-warning-default" : "text-text-primary"
                  }`}>
                    {audit.severityCounts[sev]}
                  </span>
                  <span className="text-[11px] text-text-secondary capitalize">{sev}</span>
                </div>
              ))}
            </div>
            <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">Findings</div>
            <div className="flex flex-col">
              {findings.map((f) => (
                <div key={f.id} className="flex items-center gap-2.5 border-b border-border-default py-3 last:border-0">
                  <span className={`w-[3px] shrink-0 self-stretch rounded-sm ${
                    f.severity === "critical" ? "bg-error-default" : f.severity === "high" ? "bg-warning-default" : f.severity === "medium" ? "bg-info-default" : "bg-border-strong"
                  }`} />
                  <Badge variant={f.severity}>{f.severity}</Badge>
                  <span className="flex-1">{f.title}</span>
                  <span className="text-xs text-text-secondary">{f.pageName}</span>
                </div>
              ))}
            </div>
            <ReportActions reportType="developer" reports={reports} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="management">
        <Card>
          <CardTitle>Management Report</CardTitle>
          <CardContent className="flex flex-col gap-2.5 text-[13px]">
            <Row label="Project" value={audit.projectName} />
            <Row label="Environment" value={audit.environmentName} />
            <Row label="Duration" value={<span className="font-mono-tabular font-mono">{formatDurationSeconds(audit.durationSeconds)}</span>} />
            <Row label="Critical Issues" value={<span className="font-mono-tabular font-mono text-error-default">{audit.severityCounts.critical}</span>} />
            <Row label="High Issues" value={<span className="font-mono-tabular font-mono text-warning-default">{audit.severityCounts.high}</span>} />
            <div className="flex justify-between border-t border-border-default pt-2.5">
              <span className="text-text-secondary">Release Recommendation</span>
              <Badge variant={audit.severityCounts.critical > 0 ? "high" : "accepted"}>
                {audit.severityCounts.critical > 0 ? "Not Recommended" : "Recommended"}
              </Badge>
            </div>
            <ReportActions reportType="management" reports={reports} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="executive">
        <Card>
          <CardTitle>Executive Summary</CardTitle>
          <CardContent className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">Overall Status</span>
              <Badge variant={audit.severityCounts.critical > 0 ? "high" : "accepted"}>
                {audit.severityCounts.critical > 0 ? "Needs Attention" : "Healthy"}
              </Badge>
            </div>
            <Row label="Pages Tested" value={<span className="font-mono-tabular font-mono">{audit.estimatedPages}</span>} />
            <Row
              label="Major Risks"
              value={
                findings.find((f) => f.severity === "critical")?.title ?? "None identified this run"
              }
            />
            <div className="flex justify-between border-t border-border-default pt-2.5">
              <span className="text-text-secondary">Recommendation</span>
              <span>{audit.severityCounts.critical > 0 ? "Hold release until critical findings are fixed" : "Safe to proceed"}</span>
            </div>
            <ReportActions reportType="executive" reports={reports} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-secondary">{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Wired to real Report Engine output: each tab's "Download PDF" links to the matching-type PDF
 * (`Report.type` === this tab), and "Export CSV" links to the audit's Findings CSV — the only
 * export format Report Engine actually produces (there is no HTML report, so a previous
 * "Export HTML" button was replaced rather than left pointing at nothing). "Print" uses the
 * browser's own print dialog, a real zero-backend action.
 */
function ReportActions({ reportType, reports }: { reportType: ReportType; reports: Report[] }) {
  const pdf = reports.find((r) => r.type === reportType && r.format === "pdf");
  const csv = reports.find((r) => r.format === "csv");
  const disabledLinkClass = "pointer-events-none opacity-45";

  return (
    <div className="mt-5 flex gap-2">
      {pdf?.downloadUrl ? (
        <a href={pdf.downloadUrl} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "secondary" }))}>
          Download PDF
        </a>
      ) : (
        <span className={cn(buttonVariants({ variant: "secondary" }), disabledLinkClass)}>Download PDF</span>
      )}
      {csv?.downloadUrl ? (
        <a href={csv.downloadUrl} download className={cn(buttonVariants({ variant: "secondary" }))}>
          Export CSV
        </a>
      ) : (
        <span className={cn(buttonVariants({ variant: "secondary" }), disabledLinkClass)}>Export CSV</span>
      )}
      <Button variant="outline" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
