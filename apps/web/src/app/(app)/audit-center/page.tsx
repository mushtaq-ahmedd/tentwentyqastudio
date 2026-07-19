import { SetHeader } from "@/components/shell/set-header";
import { AuditConfigForm } from "@/components/audit/audit-config-form";
import { environmentsApi, projectsApi } from "@/lib/api";

export default async function AuditCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const projectsRes = await projectsApi.fetchProjects();
  if (!projectsRes.success) throw new Error(projectsRes.error.message);

  // Environments are project-scoped — fetch for every project so the form can react to selection.
  const allEnvironments = (
    await Promise.all(projectsRes.data.map((p) => environmentsApi.fetchEnvironments(p.id)))
  ).flatMap((r) => (r.success ? r.data : []));

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
