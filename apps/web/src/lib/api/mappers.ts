/**
 * Prisma row -> frontend type converters. Keeps the enum-casing/shape translation in one place
 * so every lib/api/*.ts file stays focused on querying, not reshaping.
 */
import type { ContentSheetParseResult } from "@tentwenty/core";
import type {
  Prisma,
  Project as DbProject,
  Environment as DbEnvironment,
  KnowledgeSource as DbKnowledgeSource,
  Audit as DbAudit,
  EngineResult as DbEngineResult,
  Finding as DbFinding,
  Evidence as DbEvidence,
  Report as DbReport,
  User as DbUser,
  PlatformSettings as DbPlatformSettings,
} from "@tentwenty/db";
import type {
  AdminUser,
  Audit,
  EngineName,
  Environment,
  EnvironmentAuthStatus,
  Evidence,
  Finding,
  KnowledgeSource,
  KnowledgeSourceType,
  PlatformSettings,
  Project,
  ProjectStatus,
  Report,
  ReportFormat,
  ReportType,
  Severity,
  UserRole,
  ValidationType,
} from "@/lib/types";

// --- enum maps -------------------------------------------------------------

const PROJECT_STATUS: Record<DbProject["status"], ProjectStatus> = {
  READY: "ready",
  READY_WITH_WARNINGS: "ready-with-warnings",
  NOT_READY: "not-ready",
};

const ENV_AUTH_STATUS: Record<DbEnvironment["authStatus"], EnvironmentAuthStatus> = {
  VERIFIED: "verified",
  NOT_CONFIGURED: "not-configured",
};

const KNOWLEDGE_TYPE: Record<DbKnowledgeSource["type"], KnowledgeSourceType> = {
  REQUIREMENTS_DOCUMENT: "Requirements Document",
  BRD: "BRD",
  PRD: "PRD",
  ACCEPTANCE_CRITERIA: "Acceptance Criteria",
  TEST_CASES: "Test Cases",
  BUSINESS_RULES: "Business Rules",
  CONTENT_SHEETS: "Content Sheets",
  FIGMA_DESIGN: "Figma Design",
};

const KNOWLEDGE_ICON: Record<KnowledgeSourceType, KnowledgeSource["icon"]> = {
  "Requirements Document": "doc",
  BRD: "doc",
  PRD: "doc",
  "Acceptance Criteria": "doc",
  "Test Cases": "checklist",
  "Business Rules": "doc",
  "Content Sheets": "sheet",
  "Figma Design": "figma",
};

const AUDIT_STATUS: Record<DbAudit["status"], Audit["status"]> = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

const VALIDATION_TYPE: Record<string, ValidationType> = {
  UI_VALIDATION: "UI Validation",
  FIGMA_COMPARISON: "Figma Comparison",
  CONTENT_VALIDATION: "Content Validation",
  GRAMMAR_VALIDATION: "Grammar Validation",
  FUNCTIONAL_VALIDATION: "Functional Validation",
  BROWSER_VALIDATION: "Browser Validation",
};

const ENGINE_NAME: Record<DbEngineResult["engine"], EngineName> = {
  DISCOVERY: "Discovery",
  BROWSER: "Browser",
  FIGMA: "Figma",
  ELEMENT_MATCHING: "Element Matching",
  UI_VALIDATION: "UI Validation",
  VISUAL: "Visual",
  CONTENT: "Content",
  FUNCTIONAL: "Functional",
  BROWSER_VALIDATION: "Browser Validation",
  ACCESSIBILITY: "Accessibility",
  PERFORMANCE: "Performance",
  SECURITY: "Security",
  CONFIDENCE: "Confidence",
  EVIDENCE: "Evidence",
  AI: "AI",
  REPORT: "Report Generation",
};

const ENGINE_STATUS: Record<DbEngineResult["status"], Audit["engineResults"][number]["status"]> = {
  WAITING: "waiting",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
};

const SEVERITY: Record<DbFinding["severity"], Severity> = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

const FINDING_STATUS: Record<DbFinding["status"], Finding["status"]> = {
  NEW: "new",
  REVIEWED: "reviewed",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  IGNORED: "ignored",
};

const EVIDENCE_TYPE: Record<DbEvidence["type"], Evidence["type"]> = {
  SCREENSHOT: "screenshot",
  HIGHLIGHTED_SCREENSHOT: "screenshot",
  DOM_SNAPSHOT: "dom",
  HTML_SNAPSHOT: "html",
  CSS_SNAPSHOT: "css",
  CONSOLE_LOGS: "console",
  NETWORK_LOGS: "console",
  API_RESPONSE: "console",
  TRACE_FILE: "console",
};

const REPORT_TYPE: Record<DbReport["type"], ReportType> = {
  DEVELOPER: "developer",
  MANAGEMENT: "management",
  EXECUTIVE: "executive",
};

const REPORT_FORMAT: Record<DbReport["format"], ReportFormat> = {
  PDF: "pdf",
  CSV: "csv",
};

const USER_ROLE: Record<DbUser["role"], UserRole> = {
  ADMINISTRATOR: "Administrator",
  QA_LEAD: "QA Lead",
  QA_ENGINEER: "QA Engineer",
  VIEWER: "Viewer",
};

export const USER_ROLE_TO_DB: Record<UserRole, DbUser["role"]> = {
  Administrator: "ADMINISTRATOR",
  "QA Lead": "QA_LEAD",
  "QA Engineer": "QA_ENGINEER",
  Viewer: "VIEWER",
};

// --- converters --------------------------------------------------------------

export type ProjectWithAggregates = DbProject & {
  owner: DbUser;
  environmentsCount: number;
  lastAuditAt: Date | null;
  lastReportAt: Date | null;
  totalFindings: number;
  criticalFindings: number;
};

export function toProject(p: ProjectWithAggregates): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    clientName: p.clientName,
    baseUrl: p.baseUrl,
    figmaFileUrl: p.figmaFileUrl,
    status: PROJECT_STATUS[p.status],
    owner: p.owner.name,
    createdAt: p.createdAt.toISOString(),
    environmentsCount: p.environmentsCount,
    lastAuditAt: p.lastAuditAt?.toISOString() ?? null,
    lastReportAt: p.lastReportAt?.toISOString() ?? null,
    totalFindings: p.totalFindings,
    criticalFindings: p.criticalFindings,
    screenshotQuality: (p.screenshotQuality as "High" | "Medium" | null) ?? null,
    defaultTimeoutSeconds: p.defaultTimeoutSeconds,
    retryCount: p.retryCount,
    defaultViewport: p.defaultViewport,
  };
}

export function toEnvironment(e: DbEnvironment): Environment {
  return {
    id: e.id,
    projectId: e.projectId,
    name: e.name,
    url: e.url,
    loginUrl: e.loginUrl,
    status: e.online ? "online" : "offline",
    authStatus: ENV_AUTH_STATUS[e.authStatus],
    notes: e.notes,
    screenshotQuality: (e.screenshotQuality as "High" | "Medium" | null) ?? null,
    defaultTimeoutSeconds: e.defaultTimeoutSeconds,
    retryCount: e.retryCount,
    defaultViewport: e.defaultViewport,
  };
}

const KNOWLEDGE_STATUS: Record<DbKnowledgeSource["status"], KnowledgeSource["status"]> = {
  PROCESSING: "Processing",
  PROCESSED: "Processed",
  FAILED: "Failed",
};

export function toKnowledgeSource(k: DbKnowledgeSource): KnowledgeSource {
  const type = KNOWLEDGE_TYPE[k.type];
  const parsed = k.parsedContent as ContentSheetParseResult | null;
  return {
    id: k.id,
    projectId: k.projectId,
    name: k.name,
    type,
    icon: KNOWLEDGE_ICON[type],
    uploadedBy: k.uploadedBy,
    uploadedAt: k.uploadedAt.toISOString(),
    status: KNOWLEDGE_STATUS[k.status],
    parseErrors: k.status === "FAILED" ? (parsed?.errors ?? null) : null,
  };
}

export type AuditWithRelations = DbAudit & {
  project: DbProject;
  environment: DbEnvironment;
  engineResults: DbEngineResult[];
  findings: { severity: DbFinding["severity"] }[];
};

export function toAudit(a: AuditWithRelations): Audit {
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of a.findings) {
    severityCounts[SEVERITY[f.severity]]++;
  }

  return {
    id: a.id,
    runNumber: a.runNumber,
    projectId: a.projectId,
    projectName: a.project.name,
    environmentId: a.environmentId,
    environmentName: a.environment.name,
    status: AUDIT_STATUS[a.status],
    validationTypes: a.validationTypes.map((v) => VALIDATION_TYPE[v]),
    currentEngine: a.currentEngine ? ENGINE_NAME[a.currentEngine] : null,
    currentActivity: a.currentActivity,
    progressPercent: a.progressPercent,
    startedAt: a.startedAt.toISOString(),
    endedAt: a.endedAt?.toISOString() ?? null,
    durationSeconds: a.endedAt ? Math.round((a.endedAt.getTime() - a.startedAt.getTime()) / 1000) : null,
    estimatedPages: 24,
    severityCounts,
    engineResults: a.engineResults.map((er) => ({
      id: er.id,
      auditId: er.auditId,
      engine: ENGINE_NAME[er.engine],
      status: ENGINE_STATUS[er.status],
      durationSeconds: er.durationSeconds,
      findingsCount: er.findingsCount,
      errorCount: er.errorCount,
    })),
  };
}

export type FindingWithEvidence = DbFinding & { evidence: DbEvidence[]; page: { name: string } };

export function toFinding(f: FindingWithEvidence): Finding {
  return {
    id: f.id,
    auditId: f.auditId,
    pageId: f.pageId,
    pageName: f.page.name,
    projectId: f.projectId,
    engine: ENGINE_NAME[f.engine],
    severity: SEVERITY[f.severity],
    confidence: f.confidence,
    title: f.title,
    expectedResult: f.expectedResult,
    actualResult: f.actualResult,
    businessImpact: f.businessImpact,
    suggestedResolution: f.suggestedResolution,
    aiExplanation: f.aiExplanation,
    status: FINDING_STATUS[f.status],
    createdAt: f.createdAt.toISOString(),
    evidence: f.evidence.map((e) => ({
      id: e.id,
      findingId: e.findingId,
      type: EVIDENCE_TYPE[e.type],
      content: e.storagePath,
    })),
  };
}

export type ReportWithProject = DbReport & { project: DbProject; generatedBy: DbUser };

export function toReport(r: ReportWithProject): Report {
  return {
    id: r.id,
    auditId: r.auditId,
    projectId: r.projectId,
    projectName: r.project.name,
    type: REPORT_TYPE[r.type],
    format: REPORT_FORMAT[r.format],
    title: r.title,
    generatedAt: r.generatedAt.toISOString(),
    generatedBy: r.generatedBy.name,
    // Resolved by fetchReports() from the raw storagePath (not exposed on this type directly) —
    // requires an async Storage call this pure mapper can't make.
    downloadUrl: null,
  };
}

export function toAdminUser(u: DbUser): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: USER_ROLE[u.role],
    status: u.status === "ACTIVE" ? "Active" : u.status === "DISABLED" ? "Disabled" : "Invited",
    lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
  };
}

export function toSettings(s: DbPlatformSettings): PlatformSettings {
  return {
    displayName: "", // populated per-request from the current user, not the settings row
    defaultProjectId: "",
    defaultEnvironmentName: "",
    theme: "Light",
    aiProvider: s.aiProvider,
    aiConnectionStatus: "Connected",
    aiApiKeyStatus: "Valid",
    aiDefaultModel: s.aiDefaultModel,
    screenshotQuality: s.screenshotQuality as "High" | "Medium",
    defaultTimeoutSeconds: s.defaultTimeoutSeconds,
    retryCount: s.retryCount,
    defaultViewport: s.defaultViewport,
  };
}

export type { Prisma };
