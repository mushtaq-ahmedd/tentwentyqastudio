export type ProjectStatus = "ready" | "ready-with-warnings" | "not-ready";

export type Project = {
  id: string;
  name: string;
  description: string;
  clientName: string;
  baseUrl: string;
  figmaFileUrl: string | null;
  status: ProjectStatus;
  owner: string;
  createdAt: string;
  environmentsCount: number;
  lastAuditAt: string | null;
  lastReportAt: string | null;
  totalFindings: number;
  criticalFindings: number;
};

export type EnvironmentAuthStatus = "verified" | "not-configured";

export type Environment = {
  id: string;
  projectId: string;
  name: string;
  url: string;
  loginUrl: string | null;
  status: "online" | "offline";
  authStatus: EnvironmentAuthStatus;
  notes: string;
  // Validation config overrides (docs/03 Global -> Project -> Environment hierarchy). Null means
  // "inherit" — see packages/core/src/engine-config.ts for how these are resolved at audit time.
  screenshotQuality: "High" | "Medium" | null;
  defaultTimeoutSeconds: number | null;
  retryCount: number | null;
  defaultViewport: string | null;
};

export const KNOWLEDGE_SOURCE_TYPES = [
  "Requirements Document",
  "BRD",
  "PRD",
  "Acceptance Criteria",
  "Test Cases",
  "Business Rules",
  "Content Sheets",
  "Figma Design",
] as const;

export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];

export type KnowledgeSource = {
  id: string;
  projectId: string;
  name: string;
  type: KnowledgeSourceType;
  icon: "doc" | "sheet" | "checklist" | "figma";
  uploadedBy: string;
  uploadedAt: string;
  status: "Processing" | "Processed";
};
