import { environmentsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ environmentId: string }> }
) {
  const { environmentId } = await params;
  return respond(await environmentsApi.deleteEnvironment(environmentId));
}
