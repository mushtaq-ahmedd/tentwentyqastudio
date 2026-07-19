"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { useUI } from "@/components/shell/ui-provider";
import { cancelAuditAction } from "@/app/actions/audits";
import { formatClock } from "@/lib/format";
import type { Audit, EngineStatus, Finding } from "@/lib/types";

const ENGINE_CHIP: Record<EngineStatus, "completed" | "running" | "queued" | "failed"> = {
  completed: "completed",
  running: "running",
  waiting: "queued",
  failed: "failed",
};

export function LiveAuditView({ audit, findings }: { audit: Audit; findings: Finding[] }) {
  const { openConfirm } = useUI();
  const router = useRouter();

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex gap-5 text-[13px]">
            <div><span className="text-text-secondary">Run</span> <span className="font-mono-tabular font-mono font-semibold">#{audit.runNumber}</span></div>
            <div><span className="text-text-secondary">Project</span> {audit.projectName}</div>
            <div><span className="text-text-secondary">Environment</span> {audit.environmentName}</div>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              openConfirm({
                title: "Cancel Audit?",
                message: "Are you sure you want to stop this audit? Progress on the current run will be lost.",
                confirmLabel: "Cancel Audit",
                danger: true,
                onConfirm: async () => {
                  const result = await cancelAuditAction(audit.id);
                  if (result.success) {
                    toast.success(result.message);
                    router.push("/dashboard");
                  } else {
                    toast.error(result.error.message);
                  }
                },
              })
            }
          >
            Cancel Audit
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Overall Progress</CardTitle>
        <CardContent>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono-tabular font-mono text-[26px] font-semibold">{audit.progressPercent}%</span>
            <span className="text-xs text-text-secondary">{audit.currentEngine} · in progress</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-surface-secondary">
            <div className="h-full rounded-full bg-accent-default transition-all" style={{ width: `${audit.progressPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardTitle>Engine Progress</CardTitle>
          <CardContent className="flex flex-col">
            {audit.engineResults.map((er) => (
              <div key={er.id} className="flex items-center justify-between border-b border-border-default py-2.5 last:border-0">
                <span className="text-[13px]">{er.engine}</span>
                <StatusChip variant={ENGINE_CHIP[er.status]}>
                  {er.status[0].toUpperCase() + er.status.slice(1)}
                </StatusChip>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Current Activity</CardTitle>
          <CardContent>
            <div className="mb-3.5 flex items-center gap-2">
              <span className="status-dot-live relative inline-block size-1.5 rounded-full bg-info-default" />
              <span className="font-mono-tabular font-mono text-[13px]">{audit.currentActivity ?? "Idle"}</span>
            </div>
            <div className="mb-2 text-xs font-semibold">Audit Log</div>
            <div className="font-mono-tabular flex flex-col gap-1.5 font-mono text-[11.5px] text-text-secondary">
              <div>{formatClock(0)} — Audit Started</div>
              <div>{formatClock(42)} — Crawler Completed</div>
              <div>{formatClock(65)} — Discovery Completed</div>
              <div>{formatClock(134)} — {audit.currentEngine} Started</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardTitle>Live Findings</CardTitle>
        <CardContent className="flex flex-col">
          {findings.length === 0 ? (
            <p className="text-[13px] text-text-secondary">No findings yet — they&apos;ll appear here as soon as the engines detect one.</p>
          ) : (
            findings.map((f) => (
              <Link
                key={f.id}
                href={`/findings?findingId=${f.id}`}
                className="flex items-center gap-2.5 border-b border-border-default py-3 last:border-0"
              >
                <span className={`w-[3px] shrink-0 self-stretch rounded-sm ${
                  f.severity === "critical" ? "bg-error-default" : f.severity === "high" ? "bg-warning-default" : f.severity === "medium" ? "bg-info-default" : "bg-border-strong"
                }`} />
                <Badge variant={f.severity}>{f.severity[0].toUpperCase() + f.severity.slice(1)}</Badge>
                <span className="flex-1 font-medium">{f.title}</span>
                <span className="text-xs text-text-secondary">{f.pageName}</span>
                <span className="font-mono-tabular font-mono text-xs">{Math.round(f.confidence * 100)}%</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {/* Progress is a static mock value rather than driven by real engine events — this
          affordance lets you reach the summary screen without waiting for a real completion. */}
      <Button
        variant="secondary"
        render={<Link href={`/audit-center/summary/${audit.id}`} />}
        nativeButton={false}
        className="self-start"
      >
        Skip to Completion (demo) <ArrowRight className="size-3.5" />
      </Button>
    </>
  );
}
