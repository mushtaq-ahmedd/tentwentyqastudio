import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";
import { projectsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Project Settings" };

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const res = await projectsApi.fetchProject(projectId);
  if (!res.success) notFound();

  return <ProjectSettingsForm project={res.data} />;
}
