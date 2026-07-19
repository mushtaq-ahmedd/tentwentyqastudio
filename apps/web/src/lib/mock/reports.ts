import type { Report } from "@/lib/types";
import { AUDIT_COMPLETED, AUDIT_OLDER } from "./audits";
import { PROJECT_ACME, PROJECT_FENWICK } from "./projects";

export const REPORTS: Report[] = [
  { id: "report-1", auditId: AUDIT_COMPLETED, projectId: PROJECT_ACME, projectName: "Acme Corp Website", type: "developer", title: "Developer Report — Run #1041", generatedAt: "2026-07-16T10:00:00Z", generatedBy: "J. Reyes" },
  { id: "report-2", auditId: AUDIT_COMPLETED, projectId: PROJECT_ACME, projectName: "Acme Corp Website", type: "executive", title: "Executive Summary — Run #1041", generatedAt: "2026-07-16T10:01:00Z", generatedBy: "J. Reyes" },
  { id: "report-3", auditId: AUDIT_OLDER, projectId: PROJECT_FENWICK, projectName: "Fenwick Docs", type: "management", title: "Management Report — Run #1039", generatedAt: "2026-07-12T08:30:00Z", generatedBy: "A. Suri" },
];
