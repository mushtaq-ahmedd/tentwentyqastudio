"use server";

import { revalidatePath } from "next/cache";
import { environmentsApi } from "@/lib/api";
import type { ApiResponse, Environment } from "@/lib/types";

export async function addEnvironmentAction(input: {
  projectId: string;
  name: string;
  url: string;
  loginUrl?: string;
  notes?: string;
}): Promise<ApiResponse<Environment>> {
  const result = await environmentsApi.addEnvironment(input);
  revalidatePath(`/projects/${input.projectId}`);
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
