"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { connectFigmaAction } from "@/app/actions/projects";
import { addKnowledgeSourceAction } from "@/app/actions/knowledge";

/** Saving chains into the generic Confirm dialog as a success message — same handoff as modals.js. */
export function ConnectFigmaModal({ open, projectId }: { open: boolean; projectId?: string }) {
  const { closeModal, openConfirm } = useUI();
  const router = useRouter();
  const [figmaFileUrl, setFigmaFileUrl] = React.useState("");
  const [figmaAccessToken, setFigmaAccessToken] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleConnect() {
    if (!projectId) return;
    setPending(true);
    const result = await connectFigmaAction({ projectId, figmaFileUrl, figmaAccessToken });
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    // Best-effort — the Figma connection itself already succeeded; a knowledge-source listing
    // failure shouldn't be reported as this action having failed.
    addKnowledgeSourceAction({
      projectId,
      name: result.data.figmaFileName,
      type: "Figma Design",
      uploadedBy: "You",
    }).catch(() => {});

    closeModal();
    setFigmaFileUrl("");
    setFigmaAccessToken("");
    router.refresh();
    openConfirm({
      title: "Figma Connected",
      message: `"${result.data.figmaFileName}" is connected. It will now be used for Figma Comparison audits.`,
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
            Paste a Figma file link and a personal access token to enable Figma Comparison audits
            against your live pages.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label>Figma File URL</Label>
            <Input
              placeholder="https://figma.com/design/..."
              value={figmaFileUrl}
              onChange={(e) => setFigmaFileUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Personal Access Token</Label>
            <Input
              type="password"
              placeholder="figd_..."
              value={figmaAccessToken}
              onChange={(e) => setFigmaAccessToken(e.target.value)}
            />
            <p className="text-xs text-text-secondary">
              Generate one from Figma → Settings → Personal access tokens. Stored server-side only.
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button
            onClick={handleConnect}
            disabled={pending || !projectId || !figmaFileUrl.trim() || !figmaAccessToken.trim()}
          >
            {pending ? "Connecting…" : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
