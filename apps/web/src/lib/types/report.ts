export type ReportType = "developer" | "management" | "executive";
export type ReportFormat = "pdf" | "csv";

export type Report = {
  id: string;
  auditId: string;
  projectId: string;
  projectName: string;
  type: ReportType;
  format: ReportFormat;
  title: string;
  generatedAt: string;
  generatedBy: string;
  /** Short-lived signed URL to the generated file, resolved server-side. Null if no file was
   * ever generated for this row, or the stored path could no longer be signed (e.g. deleted). */
  downloadUrl: string | null;
};
