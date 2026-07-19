import { prisma } from "@tentwenty/db";
import { getSignedReportUrl } from "@tentwenty/core";
import type { ApiResponse, Report } from "@/lib/types";
import { requireUser } from "@/lib/auth/session";
import { guarded, ok } from "./client";
import { toReport, type ReportWithProject } from "./mappers";

export async function fetchReports(projectId?: string): Promise<ApiResponse<Report[]>> {
  return guarded(async () => {
    await requireUser();
    const rows = await prisma.report.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, generatedBy: true },
      orderBy: { generatedAt: "desc" },
    });

    const reports = await Promise.all(
      rows.map(async (r) => {
        const report = toReport(r as ReportWithProject);
        if (r.storagePath) {
          try {
            report.downloadUrl = await getSignedReportUrl(r.storagePath);
          } catch {
            // File missing/expired — leave downloadUrl null rather than breaking the whole list.
          }
        }
        return report;
      })
    );

    return ok(reports);
  });
}
