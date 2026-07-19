"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/shared/empty-state";
import { useUI } from "@/components/shell/ui-provider";
import {
  bulkSetFindingStatusAction,
  deleteFindingsAction,
  setFindingStatusAction,
} from "@/app/actions/findings";
import { confidenceLabel } from "@/lib/types";
import type { Evidence, Finding, FindingStatus } from "@/lib/types";

const EVIDENCE_TABS: { key: Evidence["type"]; label: string }[] = [
  { key: "screenshot", label: "Screenshot" },
  { key: "dom", label: "DOM" },
  { key: "html", label: "HTML" },
  { key: "css", label: "CSS" },
  { key: "console", label: "Console" },
];

export function FindingsExplorer({
  findings,
  initialFindingId,
}: {
  findings: Finding[];
  initialFindingId: string | null;
}) {
  const router = useRouter();
  const { openConfirm } = useUI();
  const [selectedId, setSelectedId] = React.useState(initialFindingId ?? findings[0]?.id ?? null);
  const [evidenceTab, setEvidenceTab] = React.useState<Evidence["type"]>("screenshot");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const finding = findings.find((f) => f.id === selectedId) ?? findings[0] ?? null;

  function selectFinding(id: string) {
    setSelectedId(id);
    setEvidenceTab("screenshot");
    router.replace(`/findings?findingId=${id}`, { scroll: false });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleStatus(id: string, status: FindingStatus) {
    const result = await setFindingStatusAction(id, status);
    if (result.success) toast.success(result.message);
    else toast.error(result.error.message);
  }

  async function handleBulkStatus(status: FindingStatus) {
    const ids = Array.from(selected);
    const result = await bulkSetFindingStatusAction(ids, status);
    if (result.success) {
      toast.success(result.message);
      setSelected(new Set());
    } else {
      toast.error(result.error.message);
    }
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    openConfirm({
      title: "Delete Findings",
      message: `Delete ${ids.length} selected finding(s)? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        const result = await deleteFindingsAction(ids);
        if (result.success) {
          toast.success(result.message);
          setSelected(new Set());
        } else {
          toast.error(result.error.message);
        }
      },
    });
  }

  if (findings.length === 0) {
    return (
      <EmptyState
        title="No findings yet"
        description="Findings appear here once an audit runs and validation engines detect issues."
      />
    );
  }

  const evidence = finding?.evidence.find((e) => e.type === evidenceTab);

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-[380px_1fr] gap-5">
      <div className="flex min-w-0 flex-col gap-2.5">
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-card bg-slate-900 px-3.5 py-2.5 text-[13px] text-white">
            <span>{selected.size} selected</span>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" className="bg-white/12 text-white hover:bg-white/20" onClick={() => handleBulkStatus("accepted")}>Accept</Button>
              <Button variant="secondary" size="sm" className="bg-white/12 text-white hover:bg-white/20" onClick={() => handleBulkStatus("rejected")}>Reject</Button>
              <Button variant="secondary" size="sm" className="bg-white/12 text-white hover:bg-white/20" onClick={() => handleBulkStatus("ignored")}>Ignore</Button>
              <Button variant="secondary" size="sm" className="bg-white/12 text-white hover:bg-white/20" onClick={() => toast.success(`${selected.size} findings exported.`)}>Export</Button>
              <Button variant="danger" size="sm" onClick={handleBulkDelete}>Delete</Button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1">
          {findings.map((f) => (
            <div
              key={f.id}
              onClick={() => selectFinding(f.id)}
              className={`flex cursor-pointer gap-2.5 rounded-card border p-3 transition-colors ${
                f.id === finding?.id ? "border-accent-default bg-accent-subtle" : "border-border-default bg-bg-surface hover:border-border-strong"
              }`}
            >
              <Checkbox
                checked={selected.has(f.id)}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={() => toggleSelect(f.id)}
                aria-label={`Select finding: ${f.title}`}
                className="mt-0.5"
              />
              <span className={`w-[3px] shrink-0 self-stretch rounded-sm ${
                f.severity === "critical" ? "bg-error-default" : f.severity === "high" ? "bg-warning-default" : f.severity === "medium" ? "bg-info-default" : "bg-border-strong"
              }`} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 truncate text-[13px] font-medium">{f.title}</div>
                <div className="text-[11.5px] text-text-secondary">
                  {f.pageName} · {f.engine} ·{" "}
                  <Tooltip>
                    <TooltipTrigger className="font-mono-tabular font-mono">{Math.round(f.confidence * 100)}%</TooltipTrigger>
                    <TooltipContent>{confidenceLabel(f.confidence)} confidence</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {finding && (
        <div className="overflow-y-auto rounded-card border border-border-default bg-bg-surface p-[18px] shadow-subtle">
          <div className="mb-4.5 flex items-center gap-2.5">
            <Badge variant={finding.severity}>{finding.severity[0].toUpperCase() + finding.severity.slice(1)}</Badge>
            <span className="text-[15px] font-semibold">{finding.title}</span>
            <Badge variant="neutral" className="ml-auto">{finding.status[0].toUpperCase() + finding.status.slice(1)}</Badge>
          </div>

          <div className="mb-4.5">
            <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">Overview</div>
            <div className="flex gap-6 text-[12.5px] text-text-secondary">
              <span>Page: <span className="text-text-primary">{finding.pageName}</span></span>
              <span>Engine: <span className="text-text-primary">{finding.engine}</span></span>
              <span>Confidence: <span className="font-mono-tabular font-mono text-text-primary">{Math.round(finding.confidence * 100)}% ({confidenceLabel(finding.confidence)})</span></span>
            </div>
          </div>

          <Section label="Expected Result">{finding.expectedResult}</Section>
          <Section label="Actual Result">{finding.actualResult}</Section>
          <Section label="Business Impact">{finding.businessImpact}</Section>
          <Section label="Suggested Resolution">{finding.suggestedResolution}</Section>
          {finding.aiExplanation && (
            <div className="mb-4.5 rounded-card border border-border-default bg-bg-surface-secondary p-3">
              <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">
                AI Explanation
              </div>
              <div className="text-[13.5px]">{finding.aiExplanation}</div>
            </div>
          )}

          <div className="mb-4.5">
            <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">Evidence</div>
            <Tabs value={evidenceTab} onValueChange={(v) => setEvidenceTab(v as Evidence["type"])}>
              <TabsList className="mb-2.5">
                {EVIDENCE_TABS.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} disabled={!finding.evidence.some((e) => e.type === t.key)}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {evidence ? (
              evidence.type === "screenshot" ? (
                evidence.content.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not a static asset Next can optimize.
                  <img
                    src={evidence.content}
                    alt={`${finding.title} — screenshot evidence`}
                    className="max-h-96 w-full rounded-card border border-border-default object-contain"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-card border border-border-default bg-bg-surface-secondary text-xs text-text-secondary">
                    {evidence.content}
                  </div>
                )
              ) : (
                <pre className="overflow-x-auto rounded-card bg-slate-900 p-3.5 font-mono text-xs whitespace-pre-wrap text-[#dfe3e8]">{evidence.content}</pre>
              )
            ) : (
              <p className="text-xs text-text-secondary">No {evidenceTab} evidence captured for this finding.</p>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => handleStatus(finding.id, "accepted")}>Accept</Button>
            <Button variant="secondary" onClick={() => handleStatus(finding.id, "rejected")}>Reject</Button>
            <Button variant="outline" onClick={() => handleStatus(finding.id, "ignored")}>Ignore</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4.5">
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-text-secondary uppercase">{label}</div>
      <div className="text-[13.5px]">{children}</div>
    </div>
  );
}
