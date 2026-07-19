"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";

const STATUS_CHIP: Record<ProjectStatus, "completed" | "failed" | "running"> = {
  ready: "completed",
  "not-ready": "failed",
  "ready-with-warnings": "running",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  ready: "Ready",
  "not-ready": "Not Ready",
  "ready-with-warnings": "Ready with Warnings",
};

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = React.useState("");
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex gap-2.5">
        <Input
          placeholder="Search projects"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="secondary">Filter</Button>
        <Button variant="secondary">Sort</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={projects.length === 0 ? "No projects yet" : "No projects match your search"}
          description={
            projects.length === 0
              ? "Create a project and connect an environment to start running audits."
              : "Try a different search term."
          }
        />
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-default text-[11px] font-medium tracking-[0.04em] text-text-secondary uppercase">
              <th className="pb-2.5 text-left">Project Name</th>
              <th className="pb-2.5 text-left">Client</th>
              <th className="pb-2.5 text-left">Last Audit</th>
              <th className="pb-2.5 text-left">Status</th>
              <th className="pb-2.5 text-left">Last Report</th>
              <th className="pb-2.5 text-left">Findings</th>
              <th className="pb-2.5 text-left">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.id} className="cursor-pointer border-b border-border-default last:border-0 hover:bg-bg-surface-secondary">
                <td className="py-3 font-medium">
                  <Link href={`/projects/${project.id}`} className="block">{project.name}</Link>
                </td>
                <td className="py-3">{project.clientName}</td>
                <td className="py-3 text-text-secondary">
                  {project.lastAuditAt ? formatRelativeTime(project.lastAuditAt) : "Never"}
                </td>
                <td className="py-3">
                  <StatusChip variant={STATUS_CHIP[project.status]}>{STATUS_LABEL[project.status]}</StatusChip>
                </td>
                <td className="py-3 text-text-secondary">
                  {project.lastReportAt ? formatRelativeTime(project.lastReportAt) : "—"}
                </td>
                <td className="font-mono-tabular py-3 font-mono">{project.totalFindings}</td>
                <td className="py-3">{project.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
