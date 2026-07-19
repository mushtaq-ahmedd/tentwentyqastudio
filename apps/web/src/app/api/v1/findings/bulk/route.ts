import { type NextRequest } from "next/server";
import { findingsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

/** Extension beyond doc05's singular PATCH — bulk actions the Findings screen needs. */
export async function PATCH(request: NextRequest) {
  const { findingIds, status } = await request.json();
  return respond(await findingsApi.bulkSetFindingStatus(findingIds, status));
}

export async function DELETE(request: NextRequest) {
  const { findingIds } = await request.json();
  return respond(await findingsApi.deleteFindings(findingIds));
}
