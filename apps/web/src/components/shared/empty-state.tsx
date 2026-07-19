import type { ReactNode } from "react";

/**
 * docs/09-dashboard-ux.md: empty states must explain what this page is, why it exists,
 * and what to do next.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-bg-surface-secondary px-6 py-14 text-center">
      {icon && <div className="mb-1 text-text-secondary">{icon}</div>}
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      <p className="max-w-sm text-[13px] text-text-secondary">{description}</p>
      {action && <div className="mt-3 flex gap-2.5">{action}</div>}
    </div>
  );
}
