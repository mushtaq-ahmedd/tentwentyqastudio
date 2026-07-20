"use client";

import * as React from "react";
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
import type { Audit, EngineStatus, Finding } from "@/lib/types";

const ENGINE_CHIP: Record<EngineStatus, "completed" | "running" | "queued" | "failed"> = {
  completed: "completed",
  running: "running",
  waiting: "queued",
  failed: "failed",
};

/** How often to poll for fresh progress while an audit is actually in flight. Audits run as a
 * BullMQ background job (docs/03/docs/08) — this page previously fetched the audit exactly once
 * at initial server render and never again, so it froze at whatever progress existed the moment
 * the page loaded, looking permanently "stuck" even when the backend had long since finished
 * (live-observed: a real audit completed in ~12 minutes while this page still showed its first-
 * load 0%/DISCOVERY state indefinitely, since nothing ever asked the server for an update).
 *
 * Every server-rendered page here pays a real network round trip to Supabase Auth's `getUser()`
 * (correct/required — it revalidates the session, unlike a local-only JWT decode) before it does
 * anything else; live-observed at ~4s per request in this environment (Supabase project region
 * is ap-northeast-2). That's *longer* than a naive fixed-interval poll would wait between firing
 * requests, so a plain `setInterval(() => router.refresh(), 3000)` stacks up overlapping requests
 * — and since they can resolve out of order, a slow, stale response can overwrite a newer one and
 * the UI never visibly progresses even though the network tab shows fresh data going by
 * (live-observed on a real audit: requests kept returning correct, fully up-to-date/completed
 * data, but the rendered page stayed frozen at 0%). The `refreshPending` ref guarantees only one
 * refresh is ever in flight — the next poll is skipped, not queued, until the current one has
 * actually landed and produced a new `audit` prop. */
const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES: Audit["status"][] = ["completed", "failed", "cancelled"];

export function LiveAuditView({ audit, findings }: { audit: Audit; findings: Finding[] }) {
  const { openConfirm } = useUI();
  const router = useRouter();
  const refreshPending = React.useRef(false);

  React.useEffect(() => {
    refreshPending.current = false; // a fresh `audit` prop just landed — safe to poll again
  }, [audit]);

  React.useEffect(() => {
    if (TERMINAL_STATUSES.includes(audit.status)) return;
    const id = setInterval(() => {
      if (refreshPending.current) return; // previous refresh hasn't resolved yet — don't stack up
      refreshPending.current = true;
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [audit.status, router]);

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
            <span className="text-xs text-text-secondary">
              {audit.currentEngine ?? "—"} · {audit.status}
            </span>
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
              {audit.engineResults
                .filter((er) => er.status === "completed" || er.status === "failed")
                .map((er) => (
                  <div key={er.id}>
                    {er.engine} {er.status}
                    {er.durationSeconds !== null ? ` (${er.durationSeconds}s)` : ""}
                  </div>
                ))}
              {audit.currentEngine && <div>{audit.currentEngine} running…</div>}
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

      {(audit.status === "completed" || audit.status === "failed") && (
        <Button
          render={<Link href={`/audit-center/summary/${audit.id}`} />}
          nativeButton={false}
          className="self-start"
        >
          View Summary <ArrowRight className="size-3.5" />
        </Button>
      )}
    </>
  );
}
