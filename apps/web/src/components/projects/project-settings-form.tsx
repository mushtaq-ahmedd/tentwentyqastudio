"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUI } from "@/components/shell/ui-provider";
import { archiveProjectAction, deleteProjectAction } from "@/app/actions/projects";
import type { Project } from "@/lib/types";

export function ProjectSettingsForm({ project }: { project: Project }) {
  const { openConfirm } = useUI();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-[640px]">
        <CardTitle>Project Settings</CardTitle>
        <CardContent className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label>Project Name</Label>
            <Input defaultValue={project.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} defaultValue={project.description} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Owner</Label>
            <Select defaultValue={project.owner}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={project.owner}>{project.owner}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Retention Policy</Label>
            <Select defaultValue="90 days">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="90 days">90 days</SelectItem>
                <SelectItem value="1 year">1 year</SelectItem>
                <SelectItem value="Forever">Forever</SelectItem>
              </SelectContent>
            </Select>
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
