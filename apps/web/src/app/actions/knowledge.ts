"use server";

import { revalidatePath } from "next/cache";
import { knowledgeApi } from "@/lib/api";
import type { ApiResponse, KnowledgeSource, KnowledgeSourceType } from "@/lib/types";

export async function addKnowledgeSourceAction(input: {
  projectId: string;
  name: string;
  type: KnowledgeSourceType;
  uploadedBy: string;
}): Promise<ApiResponse<KnowledgeSource>> {
  const result = await knowledgeApi.addKnowledgeSource(input);
  revalidatePath(`/projects/${input.projectId}/knowledge`);
  return result;
}

export async function connectFigmaAction(projectId: string): Promise<ApiResponse<KnowledgeSource>> {
  const result = await knowledgeApi.addKnowledgeSource({
    projectId,
    name: "Homepage.fig",
    type: "Figma Design",
    uploadedBy: "You",
  });
  revalidatePath(`/projects/${projectId}/knowledge`);
  return result;
}

export async function deleteKnowledgeSourceAction(
  projectId: string,
  sourceId: string
): Promise<ApiResponse<null>> {
  const result = await knowledgeApi.deleteKnowledgeSource(sourceId);
  revalidatePath(`/projects/${projectId}/knowledge`);
  return result;
}
