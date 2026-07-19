import Link from "next/link";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDurationSeconds, formatRelativeTime } from "@/lib/format";
import type { Audit, AuditStatus } from "@/lib/types";

const STATUS_CHIP: Record<AuditStatus, "completed" | "failed" | "running" | "queued"> = {
  completed: "completed",
  failed: "failed",
  running: "running",
  cancelled: "failed",
  queued: "queued",
};

export function AuditHistoryTable({ audits, showProject = true }: { audits: Audit[]; showProject?: boolean }) {
  if (audits.length === 0) {
    return <EmptyState title="No audits yet" description="Run your first audit to begin validating your project." />;
  }

  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border-default text-[11px] font-medium tracking-[0.04em] text-text-secondary uppercase">
          <th className="pb-2.5 text-left">Run ID</th>
          {showProject && <th className="pb-2.5 text-left">Project</th>}
          <th className="pb-2.5 text-left">Environment</th>
          <th className="pb-2.5 text-left">Status</th>
          <th className="pb-2.5 text-left">Date</th>
          <th className="pb-2.5 text-left">Duration</th>
          <th className="pb-2.5 text-left">Findings</th>
        </tr>
      </thead>
      <tbody>
        {audits.map((audit) => (
          <tr key={audit.id} className="cursor-pointer border-b border-border-default last:border-0 hover:bg-bg-surface-secondary">
            <td className="py-3">
              <Link
                href={audit.status === "running" ? `/audit-center/live/${audit.id}` : `/audit-center/summary/${audit.id}`}
                className="font-mono-tabular block font-mono"
              >
                #{audit.runNumber}
              </Link>
            </td>
            {showProject && <td className="py-3">{audit.projectName}</td>}
            <td className="py-3">{audit.environmentName}</td>
            <td className="py-3">
              <StatusChip variant={STATUS_CHIP[audit.status]}>
                {audit.status[0].toUpperCase() + audit.status.slice(1)}
              </StatusChip>
            </td>
            <td className="py-3 text-text-secondary">{formatRelativeTime(audit.startedAt)}</td>
            <td className="font-mono-tabular py-3 font-mono">{formatDurationSeconds(audit.durationSeconds)}</td>
            <td className="font-mono-tabular py-3 font-mono">
              {Object.values(audit.severityCounts).reduce((a, b) => a + b, 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
