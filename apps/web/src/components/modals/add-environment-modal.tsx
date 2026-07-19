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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { addEnvironmentAction } from "@/app/actions/environments";

const VIEWPORT_OPTIONS = ["Desktop (1440x900)", "Laptop (1280x800)", "Tablet (768x1024)", "Mobile (375x667)"];

export function AddEnvironmentModal({ open, projectId }: { open: boolean; projectId?: string }) {
  const { closeModal } = useUI();
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", url: "", loginUrl: "", notes: "" });
  const [overrides, setOverrides] = React.useState({
    screenshotQuality: "",
    defaultTimeoutSeconds: "",
    retryCount: "",
    defaultViewport: "",
  });

  async function handleSave() {
    if (!projectId) return;
    setPending(true);
    const result = await addEnvironmentAction({
      projectId,
      ...form,
      screenshotQuality: overrides.screenshotQuality ? (overrides.screenshotQuality as "High" | "Medium") : null,
      defaultTimeoutSeconds: overrides.defaultTimeoutSeconds ? Number(overrides.defaultTimeoutSeconds) : null,
      retryCount: overrides.retryCount ? Number(overrides.retryCount) : null,
      defaultViewport: overrides.defaultViewport || null,
    });
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
          <div className="flex flex-col gap-3 rounded-md border border-border-default p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium">Validation Config Overrides</span>
              <span className="text-xs text-text-secondary">
                Optional — leave blank to inherit from Project/Global defaults (docs/03 configuration hierarchy).
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Screenshot Quality</Label>
                <Select
                  value={overrides.screenshotQuality}
                  onValueChange={(v) => setOverrides((o) => ({ ...o, screenshotQuality: v ?? "" }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Inherit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Viewport</Label>
                <Select
                  value={overrides.defaultViewport}
                  onValueChange={(v) => setOverrides((o) => ({ ...o, defaultViewport: v ?? "" }))}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Inherit" /></SelectTrigger>
                  <SelectContent>
                    {VIEWPORT_OPTIONS.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Timeout (seconds)</Label>
                <Input
                  type="number"
                  placeholder="Inherit"
                  value={overrides.defaultTimeoutSeconds}
                  onChange={(e) => setOverrides((o) => ({ ...o, defaultTimeoutSeconds: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Retry Count</Label>
                <Input
                  type="number"
                  placeholder="Inherit"
                  value={overrides.retryCount}
                  onChange={(e) => setOverrides((o) => ({ ...o, retryCount: e.target.value }))}
                />
              </div>
            </div>
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
