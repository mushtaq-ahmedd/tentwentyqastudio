import type { DashboardKpis } from "@/lib/types";
import { formatDurationSeconds, formatPercent } from "@/lib/format";

/** docs/09-dashboard-ux.md "Dashboard KPIs" — meaningful only, no vanity metrics. */
export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  const tiles: { label: string; value: string; tone?: "critical" }[] = [
    { label: "Total Projects", value: String(kpis.totalProjects) },
    { label: "Running Audits", value: String(kpis.runningAudits) },
    { label: "Completed Audits", value: String(kpis.completedAudits) },
    { label: "Critical Findings", value: String(kpis.criticalFindings), tone: "critical" },
    { label: "Time Saved", value: `${kpis.timeSavedHours}h` },
    { label: "Avg. Confidence", value: formatPercent(kpis.averageConfidence) },
    { label: "Avg. Audit Duration", value: formatDurationSeconds(kpis.averageAuditDurationSeconds) },
    { label: "Engine Accuracy", value: `${kpis.engineAccuracyPercent.toFixed(1)}%` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 rounded-card border border-border-default bg-bg-surface p-[18px] shadow-subtle lg:grid-cols-8">
      {tiles.map((tile) => (
        <div key={tile.label}>
          <span
            className={`font-mono-tabular block font-mono text-[21px] font-semibold ${
              tile.tone === "critical" ? "text-error-default" : "text-text-primary"
            }`}
          >
            {tile.value}
          </span>
          <span className="mt-0.5 text-[11px] text-text-secondary">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
