import { type NextRequest } from "next/server";
import { projectsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET() {
  return respond(await projectsApi.fetchProjects());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return respond(await projectsApi.createProject(body), 201);
}
