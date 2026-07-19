import Link from "next/link";
import { notFound } from "next/navigation";
import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auditsApi } from "@/lib/api";
import { formatDurationSeconds } from "@/lib/format";

const SEVERITY_LABELS = ["critical", "high", "medium", "low"] as const;

export default async function AuditSummaryPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const res = await auditsApi.fetchAudit(auditId);
  if (!res.success) notFound();
  const audit = res.data;
  const isFailed = audit.status === "failed" || audit.status === "cancelled";

  return (
    <>
      <SetHeader title={isFailed ? "Audit Failed" : "Audit Complete"} pills={[{ label: audit.projectName }, { label: audit.environmentName }]} />
      <Card className="mx-auto max-w-[640px]">
        <CardContent>
          <div className="py-2 pb-5 text-center">
            <Badge variant={isFailed ? "critical" : "accepted"} className="px-3.5 py-1.5 text-[13px]">
              {isFailed ? "Audit Failed" : "Audit Complete"}
            </Badge>
            <div className="mt-2.5 text-[13px] text-text-secondary">
              {audit.projectName} · {audit.environmentName} · Duration{" "}
              <span className="font-mono-tabular font-mono">{formatDurationSeconds(audit.durationSeconds)}</span>
            </div>
          </div>

          {isFailed ? (
            <p className="mb-5 text-center text-[13px] text-text-secondary">
              This audit didn&apos;t complete. Check the engine that failed in{" "}
              <Link href="/history" className="font-medium text-accent-default hover:underline">History</Link>{" "}
              for details, then re-run once the underlying issue is fixed.
            </p>
          ) : (
            <div className="mb-5 grid grid-cols-4 gap-3">
              {SEVERITY_LABELS.map((sev) => (
                <div key={sev} className="text-center">
                  <span className={`font-mono-tabular block font-mono text-[21px] font-semibold ${
                    sev === "critical" ? "text-error-default" : sev === "high" ? "text-warning-default" : "text-text-primary"
                  }`}>
                    {audit.severityCounts[sev]}
                  </span>
                  <span className="text-[11px] text-text-secondary capitalize">{sev}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2.5">
            {isFailed ? (
              <Button render={<Link href="/history" />} nativeButton={false} className="flex-1 justify-center">View History</Button>
            ) : (
              <>
                <Button render={<Link href="/findings" />} nativeButton={false} className="flex-1 justify-center">View Findings</Button>
                <Button variant="secondary" render={<Link href="/reports" />} nativeButton={false} className="flex-1 justify-center">Open Report</Button>
              </>
            )}
            <Button variant="outline" render={<Link href={`/audit-center?projectId=${audit.projectId}`} />} nativeButton={false} className="flex-1 justify-center">
              Run Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
