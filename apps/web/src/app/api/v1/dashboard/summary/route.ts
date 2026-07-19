import { dashboardApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

/** Extension beyond doc05's endpoint list — the frontend's Dashboard needs one aggregated call. */
export async function GET() {
  return respond(await dashboardApi.fetchDashboardSummary());
}
