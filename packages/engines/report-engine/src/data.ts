import { prisma } from "@tentwenty/db";

/**
 * All the data every report template needs, fetched once. Findings are ordered by severity —
 * Postgres enums sort by declaration order (`Severity` is declared CRITICAL/HIGH/MEDIUM/LOW in
 * the schema), so `asc` naturally gives most-severe-first without a custom sort.
 */
export async function loadReportData(auditId: string) {
  const audit = await prisma.audit.findUniqueOrThrow({
    where: { id: auditId },
    include: {
      project: true,
      environment: true,
      findings: {
        include: { evidence: true, page: true },
        orderBy: { severity: "asc" },
      },
    },
  });

  const findingsBySeverity: Record<string, number> = {};
  const findingsByEngine: Record<string, number> = {};
  for (const f of audit.findings) {
    findingsBySeverity[f.severity] = (findingsBySeverity[f.severity] ?? 0) + 1;
    findingsByEngine[f.engine] = (findingsByEngine[f.engine] ?? 0) + 1;
  }

  const criticalCount = findingsBySeverity.CRITICAL ?? 0;
  const highCount = findingsBySeverity.HIGH ?? 0;
  // Mirrors the language ProjectStatus already uses elsewhere in the app (READY / READY_WITH_
  // WARNINGS / NOT_READY) for consistency, rather than inventing new release-readiness wording.
  const releaseReadiness =
    criticalCount > 0 ? "Not Ready for Release" : highCount > 0 ? "Ready with Warnings" : "Ready for Release";

  return { audit, findingsBySeverity, findingsByEngine, criticalCount, highCount, releaseReadiness };
}

export type ReportData = Awaited<ReturnType<typeof loadReportData>>;
