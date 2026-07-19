import { SetHeader } from "@/components/shell/set-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function HelpPage() {
  return (
    <>
      <SetHeader title="Help" />
      <EmptyState title="Help Center" description="Documentation coming soon." />
    </>
  );
}
