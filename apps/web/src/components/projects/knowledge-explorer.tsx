"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, Sheet, ListChecks, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useUI } from "@/components/shell/ui-provider";
import { deleteKnowledgeSourceAction } from "@/app/actions/knowledge";
import type { KnowledgeSource } from "@/lib/types";

const ICON_MAP: Record<KnowledgeSource["icon"], React.ComponentType<{ className?: string }>> = {
  doc: FileText,
  sheet: Sheet,
  checklist: ListChecks,
  figma: Shapes,
};

export function KnowledgeExplorer({ projectId, sources }: { projectId: string; sources: KnowledgeSource[] }) {
  const { openModal, openConfirm } = useUI();
  const [selectedId, setSelectedId] = React.useState<string | null>(sources[0]?.id ?? null);
  const selected = sources.find((s) => s.id === selectedId) ?? sources[0] ?? null;

  if (sources.length === 0) {
    return (
      <EmptyState
        title="No knowledge sources yet"
        description="Upload requirements, test cases, acceptance criteria, or a Figma design so audits can validate against them."
        action={
          <>
            <Button onClick={() => openModal("upload-knowledge-source", { projectId, mode: "file" })}>
              Upload File
            </Button>
            <Button variant="secondary" onClick={() => openModal("upload-knowledge-source", { projectId, mode: "text" })}>
              Paste Text
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-[340px_1fr] items-start gap-5">
      <div>
        {sources.map((src) => {
          const Icon = ICON_MAP[src.icon];
          const active = src.id === selected?.id;
          return (
            <button
              key={src.id}
              type="button"
              onClick={() => setSelectedId(src.id)}
              className={`mb-2 flex w-full items-center gap-2.5 rounded-card border p-3 text-left transition-colors ${
                active ? "border-accent-default bg-accent-subtle" : "border-border-default bg-bg-surface"
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-surface-secondary text-text-secondary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{src.name}</span>
                <span className="block text-[11px] text-text-secondary">{src.type} · {src.status}</span>
              </span>
            </button>
          );
        })}
        <div className="mt-3 rounded-card border-[1.5px] border-dashed border-border-strong bg-bg-surface-secondary p-6 text-center text-[12.5px] text-text-secondary">
          <div className="mb-2.5 font-medium text-text-primary">Add Knowledge Source</div>
          <div className="mb-2.5">
            Requirements, BRD/PRD, acceptance criteria, <strong>test cases</strong>, business rules, content
            sheets, or a Figma design.
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => openModal("upload-knowledge-source", { projectId, mode: "file" })}>
              Upload File
            </Button>
            <Button variant="secondary" onClick={() => openModal("upload-knowledge-source", { projectId, mode: "text" })}>
              Paste Text
            </Button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="rounded-card border border-border-default bg-bg-surface p-[18px] shadow-subtle">
          <div className="mb-3.5 text-[13.5px] font-semibold">{selected.name}</div>
          <div className="mb-4.5 flex gap-5 text-xs text-text-secondary">
            <span>Type: <span className="text-text-primary">{selected.type}</span></span>
            <span>Uploaded by: <span className="text-text-primary">{selected.uploadedBy}</span></span>
            <span>Status: <Badge variant={selected.status === "Processed" ? "accepted" : "medium"}>{selected.status}</Badge></span>
          </div>
          <div className="mb-2 text-xs font-semibold">AI Understanding — built from all uploaded sources</div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <p className="text-text-secondary">
              A structured summary (project purpose, key user flows, business rules, testing scope,
              known constraints) is generated once real engine/AI processing is wired up — see
              docs/06-ai-architecture.md.
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => toast(`Opening ${selected.name}...`)}>View</Button>
            <Button
              variant="secondary"
              onClick={() => openModal("upload-knowledge-source", { projectId, mode: "file" })}
            >
              Replace
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                openConfirm({
                  title: "Delete Source",
                  message: `Delete '${selected.name}'? Anything the AI learned from it will be removed from this project's knowledge base.`,
                  confirmLabel: "Delete Source",
                  danger: true,
                  onConfirm: async () => {
                    const result = await deleteKnowledgeSourceAction(projectId, selected.id);
                    if (result.success) {
                      toast.success(result.message);
                      setSelectedId(null);
                    } else {
                      toast.error(result.error.message);
                    }
                  },
                })
              }
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
