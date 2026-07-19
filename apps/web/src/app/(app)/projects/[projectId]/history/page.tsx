import { Card, CardContent } from "@/components/ui/card";
import { AuditHistoryTable } from "@/components/history/audit-history-table";
import { auditsApi } from "@/lib/api";

export default async function ProjectHistoryPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const res = await auditsApi.fetchAudits();
  if (!res.success) throw new Error(res.error.message);
  const audits = res.data.filter((a) => a.projectId === projectId);

  return (
    <Card>
      <CardContent>
        <AuditHistoryTable audits={audits} showProject={false} />
      </CardContent>
    </Card>
  );
}
