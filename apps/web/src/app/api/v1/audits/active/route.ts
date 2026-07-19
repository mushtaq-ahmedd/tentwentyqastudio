import { auditsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

/** Extension beyond doc05's endpoint list — powers the persistent header pill. */
export async function GET() {
  return respond(await auditsApi.fetchActiveAudit());
}
