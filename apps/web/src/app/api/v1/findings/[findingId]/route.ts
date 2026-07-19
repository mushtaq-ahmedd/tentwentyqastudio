import { type NextRequest } from "next/server";
import { findingsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ findingId: string }> }) {
  const { findingId } = await params;
  return respond(await findingsApi.fetchFinding(findingId));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
) {
  const { findingId } = await params;
  const { status } = await request.json();
  return respond(await findingsApi.setFindingStatus(findingId, status));
}
