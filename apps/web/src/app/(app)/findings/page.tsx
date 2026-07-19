import { SetHeader } from "@/components/shell/set-header";
import { FindingsExplorer } from "@/components/findings/findings-explorer";
import { findingsApi } from "@/lib/api";

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ findingId?: string }>;
}) {
  const { findingId } = await searchParams;
  const res = await findingsApi.fetchFindings();
  if (!res.success) throw new Error(res.error.message);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SetHeader title="Findings" />
      <FindingsExplorer findings={res.data} initialFindingId={findingId ?? null} />
    </div>
  );
}
