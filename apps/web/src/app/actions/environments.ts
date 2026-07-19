"use server";

import { revalidatePath } from "next/cache";
import { environmentsApi } from "@/lib/api";
import type { ApiResponse, Environment } from "@/lib/types";
import type { EnvironmentConfigOverrideInput } from "@/lib/api/environments";

export async function addEnvironmentAction(
  input: {
    projectId: string;
    name: string;
    url: string;
    loginUrl?: string;
    notes?: string;
  } & EnvironmentConfigOverrideInput
): Promise<ApiResponse<Environment>> {
  const result = await environmentsApi.addEnvironment(input);
  revalidatePath(`/projects/${input.projectId}`);
  return result;
}

export async function updateEnvironmentAction(
  projectId: string,
  environmentId: string,
  patch: {
    name?: string;
    url?: string;
    loginUrl?: string | null;
    notes?: string;
  } & EnvironmentConfigOverrideInput
): Promise<ApiResponse<Environment>> {
  const result = await environmentsApi.updateEnvironment(environmentId, patch);
  revalidatePath(`/projects/${projectId}`);
  return result;
}

export async function deleteEnvironmentAction(
  projectId: string,
  environmentId: string
): Promise<ApiResponse<null>> {
  const result = await environmentsApi.deleteEnvironment(environmentId);
  revalidatePath(`/projects/${projectId}`);
  return result;
}
