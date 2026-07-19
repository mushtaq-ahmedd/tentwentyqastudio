import { projectsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return respond(await projectsApi.fetchProject(projectId));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // 200 with the standard envelope rather than doc05's suggested 204 — a 204 response can't
  // carry a body, which would break the "every response follows the envelope" contract.
  return respond(await projectsApi.deleteProject(projectId));
}
