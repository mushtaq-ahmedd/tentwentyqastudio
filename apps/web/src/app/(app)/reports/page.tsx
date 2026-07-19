import { SetHeader } from "@/components/shell/set-header";
import { ReportsView } from "@/components/reports/reports-view";
import { auditsApi, findingsApi } from "@/lib/api";

export default async function ReportsPage() {
  const auditsRes = await auditsApi.fetchAudits();
  const audits = auditsRes.success ? auditsRes.data : [];
  const latestCompleted = audits.find((a) => a.status === "completed") ?? null;

  const findingsRes = latestCompleted
    ? await findingsApi.fetchFindings({ auditId: latestCompleted.id })
    : null;

  return (
    <>
      <SetHeader
        title="Reports"
        pills={latestCompleted ? [{ label: latestCompleted.projectName }, { label: latestCompleted.environmentName }] : []}
      />
      <ReportsView audit={latestCompleted} findings={findingsRes?.success ? findingsRes.data : []} />
    </>
  );
}
