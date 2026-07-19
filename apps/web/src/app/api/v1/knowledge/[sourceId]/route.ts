import { knowledgeApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function DELETE(_request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await params;
  return respond(await knowledgeApi.deleteKnowledgeSource(sourceId));
}
