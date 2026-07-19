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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { createProjectAction } from "@/app/actions/projects";

const STEP_LABELS = ["Basic Information", "Environments", "Authentication", "Finish"];
const DEFAULT_ENVIRONMENTS = ["Development", "QA"];

export function CreateProjectModal({ open }: { open: boolean }) {
  const { closeModal } = useUI();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", description: "", clientName: "" });

  async function handleFinish() {
    setPending(true);
    const result = await createProjectAction(form);
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(result.message);
    closeModal();
    router.push(`/projects/${result.data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>New Project — {STEP_LABELS[step - 1]}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1.5 px-6 pt-4">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-[3px] flex-1 rounded-full ${i < step ? "bg-accent-default" : "bg-border-default"}`}
            />
          ))}
        </div>

        <DialogBody>
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Project Name *</Label>
                <Input
                  value={form.name}
                  placeholder="e.g. Acme Corp Website"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  placeholder="What is this project?"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Client Name</Label>
                <Input
                  value={form.clientName}
                  placeholder="e.g. Acme Corp"
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Primary Language</Label>
                  <Select defaultValue="English">
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Time Zone</Label>
                  <Select defaultValue="UTC (GMT+0)">
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC (GMT+0)">UTC (GMT+0)</SelectItem>
                      <SelectItem value="PT (GMT-8)">PT (GMT-8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[13px] text-text-secondary">
                We recommend starting with these environments. They aren&apos;t created yet — add
                each one (with its real URL) from the project&apos;s Environments tab once it&apos;s
                created, alongside UAT, Staging, or Production.
              </p>
              {DEFAULT_ENVIRONMENTS.map((env) => (
                <div key={env} className="flex items-center justify-between border-b border-border-default py-3 last:border-0">
                  <span className="font-medium">{env}</span>
                  <Badge variant="neutral">Not yet added</Badge>
                </div>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Authentication Method</Label>
                <Select defaultValue="Username / Password">
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Username / Password">Username / Password</SelectItem>
                    <SelectItem value="Token">Token</SelectItem>
                    <SelectItem value="Cookie">Cookie</SelectItem>
                  </SelectContent>
                </Select>
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
              <p className="text-xs text-text-secondary">Credentials are always stored encrypted.</p>
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-[13px] text-text-secondary">Review before creating.</p>
              <div className="flex flex-col gap-2 rounded-card bg-bg-surface-secondary p-4 text-[13px]">
                <div className="flex justify-between"><span className="text-text-secondary">Project Name</span><span>{form.name || "(untitled)"}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Client</span><span>{form.clientName || "—"}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Suggested Environments</span><span>{DEFAULT_ENVIRONMENTS.join(", ")} (add after creation)</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Authentication</span><span>Not yet configured</span></div>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="text" onClick={closeModal}>Cancel</Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>
            )}
            {step < 4 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !form.name}>
                Next
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={pending}>
                {pending ? "Creating…" : "Create Project"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
