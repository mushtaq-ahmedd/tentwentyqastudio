"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { startAuditAction } from "@/app/actions/audits";
import { VALIDATION_TYPES, type Environment, type Project, type ValidationType } from "@/lib/types";

const VALIDATION_DESCRIPTIONS: Record<ValidationType, string> = {
  "UI Validation": "Compares rendered pages against the connected Figma design (requires Figma Comparison too — see Project Settings to connect a Figma file).",
  "Figma Comparison": "Compares live pages against the connected Figma design (connect a file first in this project's Settings tab).",
  "Content Validation": "Compares page content against an uploaded Content Sheet (Knowledge tab → Add Knowledge Source → Content Sheets). Falls back to grammar/placeholder-text checks only if no Content Sheet exists.",
  "Grammar Validation": "Checks website content for placeholder text, empty headings, and missing page titles.",
  "Functional Validation": "Checks every link on every page and reports any that are broken (unreachable or return an error).",
  "Browser Validation": "Checks for browser console errors and broken page resources (missing images, failed scripts/stylesheets/API calls) on every page.",
};

// Deliberately empty — nothing is pre-selected. Every test that runs should be a choice the user
// actually made, not a default they didn't notice (this used to silently pre-check UI Validation/
// Figma Comparison/Grammar Validation, which ran even when nothing meaningful was configured for
// them and made genuinely wanted checks like Functional Validation easy to miss).
const DEFAULT_SELECTED: ValidationType[] = [];

export function AuditConfigForm({
  projects,
  environments,
  initialProjectId,
}: {
  projects: Project[];
  environments: Environment[];
  initialProjectId: string | null;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = React.useState(initialProjectId ?? projects[0]?.id ?? "");
  const [environmentId, setEnvironmentId] = React.useState(
    environments.find((e) => e.projectId === (initialProjectId ?? projects[0]?.id))?.id ?? ""
  );
  const [selected, setSelected] = React.useState<Set<ValidationType>>(new Set(DEFAULT_SELECTED));
  const [pending, setPending] = React.useState(false);

  const projectEnvironments = environments.filter((e) => e.projectId === projectId);
  const project = projects.find((p) => p.id === projectId);

  function toggle(type: ValidationType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleRun() {
    if (!projectId || !environmentId) {
      toast.error("Select a project and environment first.");
      return;
    }
    setPending(true);
    const result = await startAuditAction({
      projectId,
      environmentId,
      validationTypes: Array.from(selected),
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    router.push(`/audit-center/live/${result.data.id}`);
  }

  return (
    <Card className="max-w-[640px]">
      <CardTitle>Audit Configuration</CardTitle>
      <CardContent className="flex flex-col gap-4.5">
        <div className="flex flex-col gap-1.5">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Environment</Label>
          <Select value={environmentId} onValueChange={(v) => setEnvironmentId(v ?? "")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select an environment" /></SelectTrigger>
            <SelectContent>
              {projectEnvironments.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Testing Types</Label>
          <div className="mt-2 flex flex-col">
            {VALIDATION_TYPES.map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-start gap-2.5 border-b border-border-default py-2.5 last:border-0"
              >
                <Checkbox checked={selected.has(type)} onCheckedChange={() => toggle(type)} />
                <div>
                  <div className="text-[13.5px] font-medium">{type}</div>
                  <div className="text-xs text-text-secondary">{VALIDATION_DESCRIPTIONS[type]}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-dashed border-border-default bg-bg-surface-secondary p-4">
          <div className="mb-2.5 text-[13.5px] font-semibold">Summary</div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between"><span className="text-text-secondary">Selected Tests</span><span>{selected.size} of {VALIDATION_TYPES.length}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Project</span><span>{project?.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Authentication</span><Badge variant="accepted">Verified</Badge></div>
          </div>
        </div>

        <Button className="justify-center" onClick={handleRun} disabled={pending || selected.size === 0}>
          <Play className="size-3.5" />
          {pending ? "Starting…" : "Run Audit"}
        </Button>
      </CardContent>
    </Card>
  );
}
