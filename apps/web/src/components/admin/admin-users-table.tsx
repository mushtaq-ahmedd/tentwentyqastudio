"use client";

import { toast } from "sonner";
import { StatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { useUI } from "@/components/shell/ui-provider";
import { removeUserAction, toggleUserStatusAction } from "@/app/actions/admin";
import { formatRelativeTime } from "@/lib/format";
import type { AdminUser } from "@/lib/types";

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const { openConfirm } = useUI();

  if (users.length === 0) {
    return <EmptyState title="No users yet" description="Invite teammates so they can start reviewing audits with you." />;
  }

  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border-default text-[11px] font-medium tracking-[0.04em] text-text-secondary uppercase">
          <th className="pb-2.5 text-left">Name</th>
          <th className="pb-2.5 text-left">Email</th>
          <th className="pb-2.5 text-left">Role</th>
          <th className="pb-2.5 text-left">Status</th>
          <th className="pb-2.5 text-left">Last Active</th>
          <th className="pb-2.5 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b border-border-default last:border-0">
            <td className="py-3 font-medium">{u.name}</td>
            <td className="py-3 text-text-secondary">{u.email}</td>
            <td className="py-3">{u.role}</td>
            <td className="py-3">
              <StatusChip variant={u.status === "Active" ? "completed" : "queued"}>{u.status}</StatusChip>
            </td>
            <td className="py-3 text-text-secondary">{u.lastActiveAt ? formatRelativeTime(u.lastActiveAt) : "—"}</td>
            <td className="py-3">
              <button
                type="button"
                className="font-medium text-accent-default hover:underline"
                onClick={() => toast(`Opens edit panel for ${u.name}`)}
              >
                Edit
              </button>
              <span className="mx-1.5">&nbsp;</span>
              <button
                type="button"
                className="font-medium text-accent-default hover:underline"
                onClick={async () => {
                  const result = await toggleUserStatusAction(u.id);
                  if (result.success) toast.success(result.message);
                  else toast.error(result.error.message);
                }}
              >
                {u.status === "Active" ? "Disable" : "Enable"}
              </button>
              <span className="mx-1.5">&nbsp;</span>
              <button
                type="button"
                className="font-medium text-error-default hover:underline"
                onClick={() =>
                  openConfirm({
                    title: "Remove User",
                    message: `Remove ${u.name} from this organization? They will immediately lose access.`,
                    confirmLabel: "Remove User",
                    danger: true,
                    onConfirm: async () => {
                      const result = await removeUserAction(u.id);
                      if (result.success) toast.success(result.message);
                      else toast.error(result.error.message);
                    },
                  })
                }
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
