import { prisma } from "@tentwenty/db";
import type { ApiResponse, KnowledgeSource, KnowledgeSourceType } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { guarded, ok } from "./client";
import { toKnowledgeSource } from "./mappers";

const KNOWLEDGE_TYPE_TO_DB: Record<KnowledgeSourceType, string> = {
  "Requirements Document": "REQUIREMENTS_DOCUMENT",
  BRD: "BRD",
  PRD: "PRD",
  "Acceptance Criteria": "ACCEPTANCE_CRITERIA",
  "Test Cases": "TEST_CASES",
  "Business Rules": "BUSINESS_RULES",
  "Content Sheets": "CONTENT_SHEETS",
  "Figma Design": "FIGMA_DESIGN",
};

export async function fetchKnowledgeSources(projectId: string): Promise<ApiResponse<KnowledgeSource[]>> {
  return guarded(async () => {
    await requireUser();
    const sources = await prisma.knowledgeSource.findMany({
      where: { projectId },
      orderBy: { uploadedAt: "desc" },
    });
    return ok(sources.map(toKnowledgeSource));
  });
}

export async function addKnowledgeSource(input: {
  projectId: string;
  name: string;
  type: KnowledgeSourceType;
  uploadedBy: string;
}): Promise<ApiResponse<KnowledgeSource>> {
  return guarded(async () => {
    await requireNotViewer();
    const source = await prisma.knowledgeSource.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        type: KNOWLEDGE_TYPE_TO_DB[input.type] as never,
        uploadedBy: input.uploadedBy,
        status: "PROCESSING",
      },
    });
    return ok(toKnowledgeSource(source), "Knowledge source added successfully.");
  });
}

export async function deleteKnowledgeSource(id: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.knowledgeSource.delete({ where: { id } });
    return ok(null, "Knowledge source deleted successfully.");
  });
}
