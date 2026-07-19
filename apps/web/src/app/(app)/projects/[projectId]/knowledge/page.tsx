import { KnowledgeExplorer } from "@/components/projects/knowledge-explorer";
import { knowledgeApi } from "@/lib/api";

export default async function ProjectKnowledgePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const res = await knowledgeApi.fetchKnowledgeSources(projectId);
  if (!res.success) throw new Error(res.error.message);

  return <KnowledgeExplorer projectId={projectId} sources={res.data} />;
}
