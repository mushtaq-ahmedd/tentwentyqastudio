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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { addKnowledgeSourceAction } from "@/app/actions/knowledge";
import { KNOWLEDGE_SOURCE_TYPES, type KnowledgeSourceType } from "@/lib/types";

const FILE_TYPES = ["PDF", "DOCX", "XLSX", "CSV", "TXT", "Markdown"];

export function UploadKnowledgeSourceModal({
  open,
  projectId,
  initialMethod = "file",
}: {
  open: boolean;
  projectId?: string;
  initialMethod?: "file" | "text";
}) {
  const { closeModal } = useUI();
  const [method, setMethod] = React.useState<"file" | "text">(initialMethod);
  const [type, setType] = React.useState<KnowledgeSourceType>("Requirements Document");
  const [filename, setFilename] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSave() {
    if (!projectId) return;
    setPending(true);
    const name = method === "file" ? filename || "New_Document.pdf" : "Pasted Content.txt";
    const result = await addKnowledgeSourceAction({ projectId, name, type, uploadedBy: "You" });
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
          <DialogTitle>Add Knowledge Source</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-1.5">
            <Label>Source Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as KnowledgeSourceType)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {KNOWLEDGE_SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={method} onValueChange={(v) => setMethod(v as "file" | "text")}>
            <TabsList>
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="text">Paste Text</TabsTrigger>
            </TabsList>
          </Tabs>

          {method === "file" ? (
            <div className="rounded-card border-[1.5px] border-dashed border-border-strong bg-bg-surface-secondary p-8 text-center text-[12.5px] text-text-secondary">
              <div className="mb-2.5">Drag a file here, or</div>
              <Input
                className="mx-auto mb-2.5 w-[70%]"
                placeholder="Checkout_Test_Cases.xlsx"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
              <div className="flex flex-wrap justify-center gap-1">
                {FILE_TYPES.map((t) => (
                  <span key={t} className="rounded bg-bg-surface px-2 py-0.5 text-[10.5px] text-text-secondary ring-1 ring-border-default">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Textarea rows={6} placeholder="Paste requirements, test cases, or business rules as plain text..." />
          )}
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : method === "file" ? "Upload" : "Add to Knowledge Base"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
