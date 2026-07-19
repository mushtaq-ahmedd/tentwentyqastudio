"use server";

import { revalidatePath } from "next/cache";
import { projectsApi } from "@/lib/api";
import type { ApiResponse, Project } from "@/lib/types";
import type { ProjectConfigOverrideInput } from "@/lib/api/projects";

export async function createProjectAction(input: {
  name: string;
  description: string;
  clientName: string;
}): Promise<ApiResponse<Project>> {
  const result = await projectsApi.createProject(input);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return result;
}

export async function updateProjectAction(
  input: {
    projectId: string;
    name: string;
    description: string;
    clientName: string;
  } & ProjectConfigOverrideInput
): Promise<ApiResponse<Project>> {
  const result = await projectsApi.updateProject(input);
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/settings`);
  revalidatePath("/projects");
  return result;
}

export async function connectFigmaAction(input: {
  projectId: string;
  figmaFileUrl: string;
  figmaAccessToken: string;
}): Promise<ApiResponse<{ project: Project; figmaFileName: string }>> {
  const result = await projectsApi.connectFigma(input);
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/dashboard");
  return result;
}

export async function archiveProjectAction(projectId: string): Promise<ApiResponse<null>> {
  const result = await projectsApi.archiveProject(projectId);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteProjectAction(projectId: string): Promise<ApiResponse<null>> {
  const result = await projectsApi.deleteProject(projectId);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return result;
}
