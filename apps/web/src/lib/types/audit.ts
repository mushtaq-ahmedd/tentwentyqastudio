import type { EngineName, EngineStatus, Severity, ValidationType } from "./common";

export type AuditStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type EngineResult = {
  id: string;
  auditId: string;
  engine: EngineName;
  status: EngineStatus;
  durationSeconds: number | null;
  findingsCount: number;
  errorCount: number;
};

export type AuditPage = {
  id: string;
  auditId: string;
  url: string;
  name: string;
  status: "pending" | "validated" | "failed";
};

export type SeverityCounts = Record<Severity, number>;

export type Audit = {
  id: string;
  runNumber: number;
  projectId: string;
  projectName: string;
  environmentId: string;
  environmentName: string;
  status: AuditStatus;
  validationTypes: ValidationType[];
  currentEngine: EngineName | null;
  currentActivity: string | null;
  progressPercent: number;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  estimatedPages: number;
  severityCounts: SeverityCounts;
  engineResults: EngineResult[];
};
