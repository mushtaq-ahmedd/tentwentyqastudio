import { Skeleton } from "@/components/ui/skeleton";

/** Generic route-loading skeleton — docs/09: skeleton loaders, never blank pages. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-card border border-border-default bg-bg-surface p-[18px] shadow-subtle">
        <Skeleton className="mb-2 h-3.5 w-[38%]" />
        <Skeleton className="mb-2 h-3.5 w-[92%]" />
        <Skeleton className="mt-1 h-7 w-[70%]" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-card border border-border-default bg-bg-surface p-[18px] shadow-subtle">
            <Skeleton className="mb-2 h-3.5 w-1/2" />
            <Skeleton className="mb-2 h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
