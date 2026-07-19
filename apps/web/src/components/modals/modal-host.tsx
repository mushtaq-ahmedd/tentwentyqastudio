"use client";

import { useUI } from "@/components/shell/ui-provider";
import type { Environment } from "@/lib/types";
import { CreateProjectModal } from "./create-project-modal";
import { AddEnvironmentModal } from "./add-environment-modal";
import { EditEnvironmentModal } from "./edit-environment-modal";
import { UploadKnowledgeSourceModal } from "./upload-knowledge-source-modal";
import { InviteUserModal } from "./invite-user-modal";
import { ConnectFigmaModal } from "./connect-figma-modal";

/** Renders whichever modal is currently open, per `useUI().modal`. */
export function ModalHost() {
  const { modal } = useUI();

  // Keying each modal by its own name + open state forces a remount exactly when it opens
  // (fresh internal form state, no reset-on-open effect needed) — prefixed by name because
  // these are siblings, so every closed modal defaulting to the same "closed" key would
  // collide.
  const openKey = (name: string) => `${name}-${modal?.name === name ? "open" : "closed"}`;

  return (
    <>
      <CreateProjectModal key={openKey("create-project")} open={modal?.name === "create-project"} />
      <AddEnvironmentModal
        key={openKey("add-environment")}
        open={modal?.name === "add-environment"}
        projectId={modal?.payload?.projectId as string | undefined}
      />
      <EditEnvironmentModal
        key={openKey("edit-environment")}
        open={modal?.name === "edit-environment"}
        projectId={modal?.payload?.projectId as string | undefined}
        environment={modal?.payload?.environment as Environment | undefined}
      />
      <UploadKnowledgeSourceModal
        key={openKey("upload-knowledge-source")}
        open={modal?.name === "upload-knowledge-source"}
        projectId={modal?.payload?.projectId as string | undefined}
        initialMethod={modal?.payload?.mode as "file" | "text" | undefined}
      />
      <InviteUserModal key={openKey("invite-user")} open={modal?.name === "invite-user"} />
      <ConnectFigmaModal
        key={openKey("connect-figma")}
        open={modal?.name === "connect-figma"}
        projectId={modal?.payload?.projectId as string | undefined}
      />
    </>
  );
}
