export type ReportType = "developer" | "management" | "executive";

export type Report = {
  id: string;
  auditId: string;
  projectId: string;
  projectName: string;
  type: ReportType;
  title: string;
  generatedAt: string;
  generatedBy: string;
};
