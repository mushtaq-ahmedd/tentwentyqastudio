import type { Metadata } from "next";
import { SetHeader } from "@/components/shell/set-header";
import { FindingsExplorer } from "@/components/findings/findings-explorer";
import { findingsApi, projectsApi } from "@/lib/api";

export const metadata: Metadata = { title: "Findings" };

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ findingId?: string; projectId?: string }>;
}) {
  const { findingId, projectId } = await searchParams;
  const [findingsRes, projectsRes] = await Promise.all([
    findingsApi.fetchFindings({ projectId }),
    projectsApi.fetchProjects(),
  ]);
  if (!findingsRes.success) throw new Error(findingsRes.error.message);
  if (!projectsRes.success) throw new Error(projectsRes.error.message);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SetHeader title="Findings" />
      <FindingsExplorer
        findings={findingsRes.data}
        projects={projectsRes.data}
        selectedProjectId={projectId ?? null}
        initialFindingId={findingId ?? null}
      />
    </div>
  );
}
