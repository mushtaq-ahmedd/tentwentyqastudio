"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { archiveProjectAction, deleteProjectAction, updateProjectAction } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

const VIEWPORT_OPTIONS = ["Desktop (1440x900)", "Laptop (1280x800)", "Tablet (768x1024)", "Mobile (375x667)"];

export function ProjectSettingsForm({ project }: { project: Project }) {
  const { openConfirm } = useUI();
  const router = useRouter();
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description);
  const [overrides, setOverrides] = React.useState({
    screenshotQuality: project.screenshotQuality ?? "",
    defaultTimeoutSeconds: project.defaultTimeoutSeconds != null ? String(project.defaultTimeoutSeconds) : "",
    retryCount: project.retryCount != null ? String(project.retryCount) : "",
    defaultViewport: project.defaultViewport ?? "",
  });
  const [pending, setPending] = React.useState(false);

  async function handleSave() {
    setPending(true);
    const result = await updateProjectAction({
      projectId: project.id,
      name,
      description,
      clientName: project.clientName,
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
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-[640px]">
        <CardTitle>Project Settings</CardTitle>
        <CardContent className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label>Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Owner</Label>
            <Select defaultValue={project.owner} disabled>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={project.owner}>{project.owner}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-secondary">Reassigning ownership isn&apos;t supported yet.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retention Policy</Label>
            <Select defaultValue="90 days" disabled>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="90 days">90 days</SelectItem>
                <SelectItem value="1 year">1 year</SelectItem>
                <SelectItem value="Forever">Forever</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-secondary">Not implemented yet — no retention enforcement exists.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-[640px]">
        <CardTitle>Validation Config Overrides</CardTitle>
        <CardContent className="flex flex-col gap-3.5">
          <p className="text-xs text-text-secondary">
            Optional — leave blank to inherit from Global defaults. Environments can further
            override these (docs/03 configuration hierarchy).
          </p>
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
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={pending || !name.trim()}>
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-[640px] border-error-subtle">
        <CardTitle className="text-error-default">Danger Zone</CardTitle>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-center"
            onClick={() =>
              openConfirm({
                title: "Archive Project",
                message: `Archive '${project.name}'? It will be hidden from the main Projects list but all data is kept and it can be restored later.`,
                confirmLabel: "Archive Project",
                onConfirm: async () => {
                  const result = await archiveProjectAction(project.id);
                  if (result.success) {
                    toast.success(result.message);
                    router.push("/projects");
                  } else {
                    toast.error(result.error.message);
                  }
                },
              })
            }
          >
            Archive Project
          </Button>
          <Button
            variant="danger"
            className="flex-1 justify-center"
            onClick={() =>
              openConfirm({
                title: "Delete Project",
                message: `This will permanently delete '${project.name}' and all its audits, findings, reports, and knowledge sources. This cannot be undone.`,
                confirmLabel: "Delete Project",
                danger: true,
                onConfirm: async () => {
                  const result = await deleteProjectAction(project.id);
                  if (result.success) {
                    toast.success(result.message);
                    router.push("/projects");
                  } else {
                    toast.error(result.error.message);
                  }
                },
              })
            }
          >
            Delete Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
