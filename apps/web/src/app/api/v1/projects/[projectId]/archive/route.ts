import { projectsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

/** Extension beyond doc05's endpoint list — archive is distinct from delete (soft, reversible). */
export async function POST(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return respond(await projectsApi.archiveProject(projectId));
}
