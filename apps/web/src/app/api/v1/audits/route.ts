import { auditsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET() {
  return respond(await auditsApi.fetchAudits());
}
