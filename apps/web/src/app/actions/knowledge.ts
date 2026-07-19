"use server";

import { revalidatePath } from "next/cache";
import { knowledgeApi } from "@/lib/api";
import type { ApiResponse, KnowledgeSource, KnowledgeSourceType } from "@/lib/types";

export async function addKnowledgeSourceAction(input: {
  projectId: string;
  name: string;
  type: KnowledgeSourceType;
  uploadedBy: string;
  file?: File;
  pastedText?: string;
}): Promise<ApiResponse<KnowledgeSource>> {
  const fileBuffer = input.file ? Buffer.from(await input.file.arrayBuffer()) : undefined;
  const result = await knowledgeApi.addKnowledgeSource({
    projectId: input.projectId,
    name: input.name,
    type: input.type,
    uploadedBy: input.uploadedBy,
    fileBuffer,
    fileContentType: input.file?.type,
    pastedText: input.pastedText,
  });
  revalidatePath(`/projects/${input.projectId}/knowledge`);
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
