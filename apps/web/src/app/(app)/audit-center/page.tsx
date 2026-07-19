import type { Metadata } from "next";
import { SetHeader } from "@/components/shell/set-header";
import { AuditConfigForm } from "@/components/audit/audit-config-form";
import { environmentsApi, projectsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Audit Center" };

export default async function AuditCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const projectsRes = await projectsApi.fetchProjects();
  if (!projectsRes.success) throw new Error(projectsRes.error.message);

  // Environments are project-scoped — fetch every project's in one query so the form can react
  // to selection (previously one query per project: 8 projects meant 8 separate round trips).
  const environmentsRes = await environmentsApi.fetchEnvironmentsForProjects(
    projectsRes.data.map((p) => p.id)
  );
  const allEnvironments = environmentsRes.success ? environmentsRes.data : [];

  return (
    <>
      <SetHeader title="Audit Center" />
      <AuditConfigForm
        projects={projectsRes.data}
        environments={allEnvironments}
        initialProjectId={projectId ?? null}
      />
    </>
  );
}
