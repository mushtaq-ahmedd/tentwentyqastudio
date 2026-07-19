import { type NextRequest } from "next/server";
import { environmentsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return respond(await environmentsApi.fetchEnvironments(projectId));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  return respond(await environmentsApi.addEnvironment({ ...body, projectId }), 201);
}
