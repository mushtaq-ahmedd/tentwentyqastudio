import type { Metadata } from "next";
import { SetHeader } from "@/components/shell/set-header";
import { ReportsView } from "@/components/reports/reports-view";
import { auditsApi, findingsApi, reportsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const auditsRes = await auditsApi.fetchAudits();
  const audits = auditsRes.success ? auditsRes.data : [];
  const latestCompleted = audits.find((a) => a.status === "completed") ?? null;

  const findingsRes = latestCompleted
    ? await findingsApi.fetchFindings({ auditId: latestCompleted.id })
    : null;
  const reportsRes = latestCompleted
    ? await reportsApi.fetchReports({ auditId: latestCompleted.id })
    : null;

  return (
    <>
      <SetHeader
        title="Reports"
        pills={latestCompleted ? [{ label: latestCompleted.projectName }, { label: latestCompleted.environmentName }] : []}
      />
      <ReportsView
        audit={latestCompleted}
        findings={findingsRes?.success ? findingsRes.data : []}
        reports={reportsRes?.success ? reportsRes.data : []}
      />
    </>
  );
}
