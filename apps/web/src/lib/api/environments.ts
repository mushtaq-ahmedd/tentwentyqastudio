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

export type EnvironmentConfigOverrideInput = {
  screenshotQuality?: "High" | "Medium" | null;
  defaultTimeoutSeconds?: number | null;
  retryCount?: number | null;
  defaultViewport?: string | null;
};

export async function addEnvironment(
  input: {
    projectId: string;
    name: string;
    url: string;
    loginUrl?: string;
    notes?: string;
  } & EnvironmentConfigOverrideInput
): Promise<ApiResponse<Environment>> {
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
        screenshotQuality: input.screenshotQuality ?? null,
        defaultTimeoutSeconds: input.defaultTimeoutSeconds ?? null,
        retryCount: input.retryCount ?? null,
        defaultViewport: input.defaultViewport ?? null,
      },
    });
    return ok(toEnvironment(env), "Environment added successfully.");
  });
}

export async function updateEnvironment(
  environmentId: string,
  patch: {
    name?: string;
    url?: string;
    loginUrl?: string | null;
    notes?: string;
  } & EnvironmentConfigOverrideInput
): Promise<ApiResponse<Environment>> {
  return guarded(async () => {
    await requireNotViewer();
    if (patch.name !== undefined && !patch.name.trim()) {
      return fail("VALIDATION_ERROR", "Environment name is required.");
    }
    if (patch.url !== undefined && !patch.url.trim()) {
      return fail("VALIDATION_ERROR", "Environment URL is required.");
    }
    const env = await prisma.environment.update({
      where: { id: environmentId },
      data: patch,
    });
    return ok(toEnvironment(env), "Environment updated successfully.");
  });
}

export async function deleteEnvironment(environmentId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.environment.delete({ where: { id: environmentId } });
    return ok(null, "Environment deleted successfully.");
  });
}
