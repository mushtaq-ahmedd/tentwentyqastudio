import { EnvironmentsGrid } from "@/components/projects/environments-grid";
import { environmentsApi } from "@/lib/api";

export default async function ProjectEnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const res = await environmentsApi.fetchEnvironments(projectId);
  if (!res.success) throw new Error(res.error.message);

  return <EnvironmentsGrid projectId={projectId} environments={res.data} />;
}
