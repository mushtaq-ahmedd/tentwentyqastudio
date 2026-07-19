import { auditsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function POST(_request: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params;
  return respond(await auditsApi.cancelAudit(auditId));
}
