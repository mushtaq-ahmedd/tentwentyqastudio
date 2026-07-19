import type { Metadata } from "next";
import { SetHeader } from "@/components/shell/set-header";
import { Card, CardContent } from "@/components/ui/card";
import { AuditHistoryTable } from "@/components/history/audit-history-table";
import { auditsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Run History" };

export default async function HistoryPage() {
  const res = await auditsApi.fetchAudits();
  if (!res.success) throw new Error(res.error.message);

  return (
    <>
      <SetHeader title="Run History" />
      <Card>
        <CardContent>
          <AuditHistoryTable audits={res.data} />
        </CardContent>
      </Card>
    </>
  );
}
