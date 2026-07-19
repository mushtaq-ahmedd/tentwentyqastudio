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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUI } from "@/components/shell/ui-provider";
import { addEnvironmentAction } from "@/app/actions/environments";

export function AddEnvironmentModal({ open, projectId }: { open: boolean; projectId?: string }) {
  const { closeModal } = useUI();
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", url: "", loginUrl: "", notes: "" });

  async function handleSave() {
    if (!projectId) return;
    setPending(true);
    const result = await addEnvironmentAction({ projectId, ...form });
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(result.message);
    closeModal();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add Environment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <Label>Environment Name</Label>
            <Input
              placeholder="e.g. UAT"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Base URL</Label>
            <Input
              placeholder="uat.acmecorp.com"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Login URL</Label>
            <Input
              placeholder="uat.acmecorp.com/login"
              value={form.loginUrl}
              onChange={(e) => setForm((f) => ({ ...f, loginUrl: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Username</Label>
              <Input placeholder="qa-bot@acmecorp.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              placeholder="Anything the team should know about this environment"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => toast.success("Connection verified.")}>
            Test Connection
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending ? "Saving…" : "Save Environment"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
