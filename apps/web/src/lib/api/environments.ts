import { prisma } from "@tentwenty/db";
import type { ApiResponse, Environment } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toEnvironment } from "./mappers";

export async function fetchEnvironments(projectId: string): Promise<ApiResponse<Environment[]>> {
  return guarded(async () => {
    await requireUser();
    const environments = await prisma.environment.findMany({ where: { projectId } });
    return ok(environments.map(toEnvironment));
  });
}

export async function addEnvironment(input: {
  projectId: string;
  name: string;
  url: string;
  loginUrl?: string;
  notes?: string;
}): Promise<ApiResponse<Environment>> {
  return guarded(async () => {
    await requireNotViewer();
    if (!input.name.trim() || !input.url.trim()) {
      return fail("VALIDATION_ERROR", "Environment name and URL are required.");
    }
    const env = await prisma.environment.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        url: input.url,
        loginUrl: input.loginUrl,
        notes: input.notes ?? "",
      },
    });
    return ok(toEnvironment(env), "Environment added successfully.");
  });
}

export async function deleteEnvironment(environmentId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.environment.delete({ where: { id: environmentId } });
    return ok(null, "Environment deleted successfully.");
  });
}
