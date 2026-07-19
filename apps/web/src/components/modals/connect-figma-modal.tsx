"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUI } from "@/components/shell/ui-provider";
import { connectFigmaAction } from "@/app/actions/knowledge";

/** Saving chains into the generic Confirm dialog as a success message — same handoff as modals.js. */
export function ConnectFigmaModal({ open, projectId }: { open: boolean; projectId?: string }) {
  const { closeModal, openConfirm } = useUI();
  const [pending, setPending] = React.useState(false);

  async function handleConnect() {
    if (!projectId) return;
    setPending(true);
    const result = await connectFigmaAction(projectId);
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    closeModal();
    openConfirm({
      title: "Figma Connected",
      message:
        "Your Figma file is connected. It will now be used for Figma Comparison audits and added to this project's knowledge base.",
      confirmLabel: "Done",
      onConfirm: () => {},
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Connect Figma</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p className="text-[13px] text-text-secondary">
            Paste a Figma file link to enable Figma Comparison audits against your live pages.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>Figma File URL</Label>
            <Input placeholder="https://figma.com/design/..." />
          </div>
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleConnect} disabled={pending || !projectId}>
            {pending ? "Connecting…" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
