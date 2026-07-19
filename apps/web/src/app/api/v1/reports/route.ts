import { type NextRequest } from "next/server";
import { reportsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;
  return respond(await reportsApi.fetchReports(projectId));
}
