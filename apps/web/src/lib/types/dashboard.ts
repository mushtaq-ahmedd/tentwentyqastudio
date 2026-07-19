import type { EngineName, EngineStatus } from "./common";

/** docs/09-dashboard-ux.md "Dashboard KPIs" — meaningful only, no vanity metrics. */
export type DashboardKpis = {
  totalProjects: number;
  runningAudits: number;
  completedAudits: number;
  criticalFindings: number;
  timeSavedHours: number;
  averageConfidence: number;
  averageAuditDurationSeconds: number;
  engineAccuracyPercent: number;
};

export type EngineHealth = {
  engine: EngineName;
  status: EngineStatus | "healthy";
};

export type ActivityEventType =
  | "audit_started"
  | "audit_completed"
  | "report_generated"
  | "project_created";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  message: string;
  projectName: string;
  timestamp: string;
};
