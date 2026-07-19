import { prisma } from "@tentwenty/db";
import { downloadEvidenceBuffer, registerEngine, uploadReport, type Engine, type EngineContext } from "@tentwenty/core";
import { loadReportData, type ReportData } from "./data";
import { findingsToCsv } from "./csv";
import { developerReportHtml, executiveReportHtml, managementReportHtml } from "./html-templates";
import { renderHtmlToPdf } from "./pdf";

type GeneratedReport = {
  type: "DEVELOPER" | "MANAGEMENT" | "EXECUTIVE";
  format: "PDF" | "CSV";
  kind: string;
  title: string;
  contentType: string;
  data: Buffer | string;
};

async function collectScreenshots(data: ReportData): Promise<Map<string, string>> {
  const screenshots = new Map<string, string>();
  for (const finding of data.audit.findings) {
    const screenshotEvidence = finding.evidence.find((e) => e.type === "SCREENSHOT");
    if (!screenshotEvidence) continue;
    try {
      const buffer = await downloadEvidenceBuffer(screenshotEvidence.storagePath);
      screenshots.set(finding.id, buffer.toString("base64"));
    } catch (err) {
      // A missing/expired evidence file shouldn't fail report generation — that finding's PDF
      // entry just renders without an embedded image.
      console.warn(`Report Engine: could not embed screenshot for finding ${finding.id}: ${(err as Error).message}`);
    }
  }
  return screenshots;
}

async function buildReports(data: ReportData): Promise<GeneratedReport[]> {
  const { audit } = data;
  const runLabel = `${audit.project.name} (Run #${audit.runNumber})`;
  const screenshots = await collectScreenshots(data);

  return [
    {
      type: "DEVELOPER",
      format: "PDF",
      kind: "developer-report",
      title: `Developer Report — ${runLabel}`,
      contentType: "application/pdf",
      data: await renderHtmlToPdf(developerReportHtml(data, screenshots)),
    },
    {
      type: "MANAGEMENT",
      format: "PDF",
      kind: "management-report",
      title: `Management Report — ${runLabel}`,
      contentType: "application/pdf",
      data: await renderHtmlToPdf(managementReportHtml(data)),
    },
    {
      type: "EXECUTIVE",
      format: "PDF",
      kind: "executive-summary",
      title: `Executive Summary — ${runLabel}`,
      contentType: "application/pdf",
      data: await renderHtmlToPdf(executiveReportHtml(data)),
    },
    {
      type: "DEVELOPER",
      format: "CSV",
      kind: "findings-export",
      title: `Findings Export — ${runLabel}`,
      contentType: "text/csv",
      data: findingsToCsv(audit.findings),
    },
  ];
}

export const reportEngine: Engine = {
  id: "report-engine",
  name: "REPORT",
  version: "0.1.0",
  description:
    "Combines findings, evidence, confidence scores, and AI explanations into Developer/Management/Executive PDF reports plus a findings CSV export (docs/04 Report Engine).",
  dependencies: ["ai-engine"],
  supportedValidationTypes: [],
  scope: "audit",

  async initialize(context: EngineContext) {
    const data = await loadReportData(context.auditId);
    const reports = await buildReports(data);

    for (const report of reports) {
      try {
        const storagePath = await uploadReport(context.auditId, report.kind, report.data, report.contentType);
        await prisma.report.create({
          data: {
            auditId: context.auditId,
            projectId: context.projectId,
            type: report.type as never,
            format: report.format as never,
            title: report.title,
            storagePath,
            generatedById: data.audit.startedById,
          },
        });
      } catch (err) {
        // One report failing to render/upload shouldn't block the others (docs/03 partial-
        // failure tolerance) — logged, not swallowed.
        console.error(`Report Engine: failed to generate "${report.kind}" for audit ${context.auditId}: ${(err as Error).message}`);
      }
    }
  },

  async validate() {
    return []; // Produces Report rows/files, not Findings — never judges (docs/03).
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — never produces its own findings to score.
  },

  async cleanup() {
    // Nothing to tear down.
  },
};

registerEngine(reportEngine);
