import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SetHeader } from "@/components/shell/set-header";
import { LiveAuditView } from "@/components/audit/live-audit-view";
import { auditsApi, findingsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Live Audit" };

export default async function LiveAuditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;
  const [auditRes, findingsRes] = await Promise.all([
    auditsApi.fetchAudit(auditId),
    findingsApi.fetchFindings({ auditId }),
  ]);
  if (!auditRes.success) notFound();

  return (
    <>
      <SetHeader title="Live Audit" pills={[{ label: auditRes.data.projectName }, { label: auditRes.data.environmentName }]} />
      <LiveAuditView audit={auditRes.data} findings={findingsRes.success ? findingsRes.data : []} />
    </>
  );
}
