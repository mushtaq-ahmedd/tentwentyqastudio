import { prisma, type Prisma } from "@tentwenty/db";
import { parseContentSheetCsv, uploadKnowledgeSourceFile } from "@tentwenty/core";
import type { ApiResponse, KnowledgeSource, KnowledgeSourceType } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
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
  /** Only meaningful for type "Content Sheets" — every other type is still the pre-existing
   * mock upload (no real ingestion exists for those yet, see deferred bug list). */
  fileBuffer?: Buffer;
  fileContentType?: string;
  pastedText?: string;
}): Promise<ApiResponse<KnowledgeSource>> {
  return guarded(async () => {
    await requireNotViewer();
    const dbType = KNOWLEDGE_TYPE_TO_DB[input.type] as never;

    const csvText = input.fileBuffer?.toString("utf8") ?? input.pastedText;
    if (input.type !== "Content Sheets" || !csvText) {
      const source = await prisma.knowledgeSource.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          type: dbType,
          uploadedBy: input.uploadedBy,
          status: "PROCESSING",
        },
      });
      return ok(toKnowledgeSource(source), "Knowledge source added successfully.");
    }

    // Real Content Sheet ingestion (docs/04 Content Engine Mode 1) — parsed once here so the
    // Content Engine reads structured rows at audit time, never re-parsing CSV mid-audit.
    if (!csvText.trim()) {
      return fail("VALIDATION_ERROR", "The content sheet is empty.");
    }
    const parseResult = parseContentSheetCsv(csvText);
    const status = parseResult.rows.length > 0 ? "PROCESSED" : "FAILED";

    const source = await prisma.knowledgeSource.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        type: "CONTENT_SHEETS",
        uploadedBy: input.uploadedBy,
        status: "PROCESSING",
      },
    });

    const storagePath = input.fileBuffer
      ? await uploadKnowledgeSourceFile(
          input.projectId,
          source.id,
          input.fileBuffer,
          input.fileContentType || "text/csv",
          "csv"
        )
      : null;

    const updated = await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status,
        storagePath,
        parsedContent: parseResult as unknown as Prisma.InputJsonValue,
      },
    });

    const message =
      status === "PROCESSED"
        ? `Content sheet parsed successfully — ${parseResult.rows.length} row(s) ready for Content Validation.${
            parseResult.errors.length ? ` ${parseResult.errors.length} row(s) skipped.` : ""
          }`
        : `Content sheet could not be parsed: ${parseResult.errors[0] ?? "no valid rows found."}`;

    return ok(toKnowledgeSource(updated), message);
  });
}

export async function deleteKnowledgeSource(id: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.knowledgeSource.delete({ where: { id } });
    return ok(null, "Knowledge source deleted successfully.");
  });
}
