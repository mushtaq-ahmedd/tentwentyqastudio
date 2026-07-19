import { type NextRequest } from "next/server";
import { findingsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";
import type { FindingStatus, Severity } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return respond(
    await findingsApi.fetchFindings({
      projectId: params.get("projectId") ?? undefined,
      auditId: params.get("auditId") ?? undefined,
      severity: (params.get("severity") as Severity) ?? undefined,
      status: (params.get("status") as FindingStatus) ?? undefined,
    })
  );
}
