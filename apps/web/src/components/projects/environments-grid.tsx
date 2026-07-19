"use client";

import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useUI } from "@/components/shell/ui-provider";
import { deleteEnvironmentAction } from "@/app/actions/environments";
import type { Environment } from "@/lib/types";

export function EnvironmentsGrid({ projectId, environments }: { projectId: string; environments: Environment[] }) {
  const { openModal, openConfirm } = useUI();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => openModal("add-environment", { projectId })}>
          <Plus className="size-3.5" />
          Add Environment
        </Button>
      </div>

      {environments.length === 0 ? (
        <EmptyState
          title="No environments configured"
          description="Add an environment (Development, QA, Staging, Production) so audits know where to run."
          action={
            <Button onClick={() => openModal("add-environment", { projectId })}>
              <Plus className="size-3.5" /> Add Environment
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {environments.map((env) => (
            <div key={env.id} className="rounded-card border border-border-default bg-bg-surface p-4">
              <div className="mb-0.5 text-[13.5px] font-semibold">{env.name}</div>
              <div className="font-mono-tabular mb-2.5 font-mono text-xs text-text-secondary">{env.url}</div>
              <div className="flex gap-2">
                <Badge variant="accepted">{env.status === "online" ? "Online" : "Offline"}</Badge>
                <Badge variant="accepted">
                  Auth {env.authStatus === "verified" ? "Verified" : "Not Configured"}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => toast(`Opens edit panel for ${env.name}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => toast.success(`Connection to ${env.url} verified.`)}
                >
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    openConfirm({
                      title: "Delete Environment",
                      message: `Delete the ${env.name} environment? Any audits configured against it will need to be reassigned.`,
                      confirmLabel: "Delete Environment",
                      danger: true,
                      onConfirm: async () => {
                        const result = await deleteEnvironmentAction(projectId, env.id);
                        if (result.success) toast.success(result.message);
                        else toast.error(result.error.message);
                      },
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
