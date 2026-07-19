import type { KnowledgeSource, KnowledgeSourceType } from "@/lib/types";
import { PROJECT_ACME } from "./projects";

const ICON_BY_TYPE: Record<KnowledgeSourceType, KnowledgeSource["icon"]> = {
  "Requirements Document": "doc",
  BRD: "doc",
  PRD: "doc",
  "Acceptance Criteria": "doc",
  "Test Cases": "checklist",
  "Business Rules": "doc",
  "Content Sheets": "sheet",
  "Figma Design": "figma",
};

export let KNOWLEDGE_SOURCES: KnowledgeSource[] = [
  { id: "ks-1", projectId: PROJECT_ACME, name: "Requirements.pdf", type: "Requirements Document", icon: "doc", uploadedBy: "J. Reyes", uploadedAt: "2026-07-14T09:00:00Z", status: "Processed", parseErrors: null },
  { id: "ks-2", projectId: PROJECT_ACME, name: "Checkout_Test_Cases.xlsx", type: "Test Cases", icon: "checklist", uploadedBy: "A. Suri", uploadedAt: "2026-07-16T09:00:00Z", status: "Processed", parseErrors: null },
  { id: "ks-3", projectId: PROJECT_ACME, name: "Acceptance_Criteria.docx", type: "Acceptance Criteria", icon: "doc", uploadedBy: "J. Reyes", uploadedAt: "2026-07-13T09:00:00Z", status: "Processed", parseErrors: null },
  { id: "ks-4", projectId: PROJECT_ACME, name: "Content_Sheet_Homepage.csv", type: "Content Sheets", icon: "sheet", uploadedBy: "J. Reyes", uploadedAt: "2026-07-12T09:00:00Z", status: "Processing", parseErrors: null },
  { id: "ks-5", projectId: PROJECT_ACME, name: "Homepage.fig", type: "Figma Design", icon: "figma", uploadedBy: "A. Suri", uploadedAt: "2026-07-10T09:00:00Z", status: "Processed", parseErrors: null },
];

export function addKnowledgeSource(input: {
  projectId: string;
  name: string;
  type: KnowledgeSourceType;
  uploadedBy: string;
}): KnowledgeSource {
  const source: KnowledgeSource = {
    id: `ks-${crypto.randomUUID().slice(0, 8)}`,
    projectId: input.projectId,
    name: input.name,
    type: input.type,
    icon: ICON_BY_TYPE[input.type],
    uploadedBy: input.uploadedBy,
    uploadedAt: new Date().toISOString(),
    status: "Processing",
    parseErrors: null,
  };
  KNOWLEDGE_SOURCES = [...KNOWLEDGE_SOURCES, source];
  return source;
}

export function deleteKnowledgeSource(id: string) {
  KNOWLEDGE_SOURCES = KNOWLEDGE_SOURCES.filter((s) => s.id !== id);
}
