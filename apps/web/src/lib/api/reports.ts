import { prisma } from "@tentwenty/db";
import type { ApiResponse, Report } from "@/lib/types";
import { requireUser } from "@/lib/auth/session";
import { guarded, ok } from "./client";
import { toReport, type ReportWithProject } from "./mappers";

export async function fetchReports(projectId?: string): Promise<ApiResponse<Report[]>> {
  return guarded(async () => {
    await requireUser();
    const reports = await prisma.report.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, generatedBy: true },
      orderBy: { generatedAt: "desc" },
    });
    return ok(reports.map((r) => toReport(r as ReportWithProject)));
  });
}
