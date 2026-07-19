"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { createTestFlowAction } from "@/app/actions/test-flows";
import { FLOW_STEP_ACTIONS, type FlowStepAction } from "@/lib/types";

type DraftStep = { action: FlowStepAction; selector: string; value: string };

const NEEDS_SELECTOR: FlowStepAction[] = ["Click", "Fill", "Assert Visible"];
const VALUE_LABEL: Record<FlowStepAction, string | null> = {
  Navigate: "Path or URL",
  Click: null,
  Fill: "Text to type",
  "Press Key": "Key (e.g. Enter)",
  "Assert Visible": null,
  "Assert Text": "Expected text",
  "Assert URL": "Expected URL substring",
};

function emptyStep(): DraftStep {
  return { action: "Click", selector: "", value: "" };
}

export function CreateTestFlowModal({ open, projectId }: { open: boolean; projectId?: string }) {
  const { closeModal } = useUI();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [startUrl, setStartUrl] = React.useState("/");
  const [steps, setSteps] = React.useState<DraftStep[]>([{ action: "Fill", selector: "", value: "" }]);
  const [pending, setPending] = React.useState(false);

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!projectId) return;
    if (!name.trim()) {
      toast.error("Give this flow a name.");
      return;
    }
    if (!startUrl.trim()) {
      toast.error("A start URL (or path) is required.");
      return;
    }
    for (const step of steps) {
      if (NEEDS_SELECTOR.includes(step.action) && !step.selector.trim()) {
        toast.error(`"${step.action}" steps require a selector.`);
        return;
      }
    }

    setPending(true);
    const result = await createTestFlowAction({
      projectId,
      name,
      startUrl,
      steps: steps.map((s) => ({
        action: s.action,
        selector: s.selector.trim() || null,
        value: s.value.trim() || null,
      })),
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success(result.message);
    closeModal();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeModal()}>
      <DialogContent showCloseButton className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Test Flow</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Flow Name</Label>
              <Input placeholder="Login (correct credentials)" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Start URL or Path</Label>
              <Input placeholder="/login" value={startUrl} onChange={(e) => setStartUrl(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Steps — replayed in order by a real browser during every audit</Label>
            <div className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 rounded-card border border-border-default p-2.5">
                  <span className="mt-2 w-5 shrink-0 text-center text-[11px] text-text-secondary">{i + 1}</span>
                  <div className="w-[150px] shrink-0">
                    <Select value={step.action} onValueChange={(v) => updateStep(i, { action: v as FlowStepAction })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FLOW_STEP_ACTIONS.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    className="flex-1"
                    placeholder={
                      step.action === "Navigate" || step.action === "Assert URL"
                        ? "(no selector needed)"
                        : "Selector, e.g. #email or text=Sign In"
                    }
                    value={step.selector}
                    disabled={step.action === "Navigate" || step.action === "Assert URL"}
                    onChange={(e) => updateStep(i, { selector: e.target.value })}
                  />
                  <Input
                    className="flex-1"
                    placeholder={VALUE_LABEL[step.action] ?? "(not used)"}
                    value={step.value}
                    disabled={VALUE_LABEL[step.action] === null}
                    onChange={(e) => updateStep(i, { value: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    className="mt-0.5 shrink-0 px-2"
                    onClick={() => removeStep(i)}
                    disabled={steps.length === 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="secondary" className="self-start" onClick={() => setSteps((prev) => [...prev, emptyStep()])}>
              <Plus className="size-3.5" /> Add Step
            </Button>
          </div>
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Create Flow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
