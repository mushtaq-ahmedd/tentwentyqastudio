"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { useUI } from "@/components/shell/ui-provider";
import { setTestFlowEnabledAction, deleteTestFlowAction } from "@/app/actions/test-flows";
import type { TestFlow } from "@/lib/types";

export function TestFlowsPanel({ projectId, flows }: { projectId: string; flows: TestFlow[] }) {
  const { openModal, openConfirm } = useUI();
  const router = useRouter();

  if (flows.length === 0) {
    return (
      <EmptyState
        title="No test flows yet"
        description="Author a multi-step flow (login, checkout, booking...) once, and it replays via a real browser on every audit that includes Functional Validation."
        action={<Button onClick={() => openModal("create-test-flow", { projectId })}>New Flow</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {flows.map((flow) => (
        <div
          key={flow.id}
          className="flex items-center gap-3 rounded-card border border-border-default bg-bg-surface p-3"
        >
          <Checkbox
            checked={flow.enabled}
            onCheckedChange={async (checked) => {
              const result = await setTestFlowEnabledAction(projectId, flow.id, checked === true);
              if (result.success) {
                toast.success(result.message);
                router.refresh();
              } else {
                toast.error(result.error.message);
              }
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium">{flow.name}</div>
            <div className="truncate text-[11.5px] text-text-secondary">
              {flow.startUrl} · {flow.steps.length} step{flow.steps.length === 1 ? "" : "s"}
            </div>
          </div>
          <Button
            variant="outline"
            className="shrink-0 px-2"
            onClick={() =>
              openConfirm({
                title: "Delete Test Flow",
                message: `Delete "${flow.name}"? It will no longer run on future audits.`,
                confirmLabel: "Delete Flow",
                danger: true,
                onConfirm: async () => {
                  const result = await deleteTestFlowAction(projectId, flow.id);
                  if (result.success) {
                    toast.success(result.message);
                    router.refresh();
                  } else {
                    toast.error(result.error.message);
                  }
                },
              })
            }
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="secondary" className="self-start" onClick={() => openModal("create-test-flow", { projectId })}>
        <Plus className="size-3.5" /> New Flow
      </Button>
    </div>
  );
}
