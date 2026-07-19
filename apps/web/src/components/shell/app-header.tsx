"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Audit, AdminUser } from "@/lib/types";
import { useUI } from "./ui-provider";
import { ProfileMenu } from "./profile-menu";
import { LiveAuditPill } from "./live-audit-pill";

export function AppHeader({
  activeAudit,
  currentUser,
}: {
  activeAudit: Audit | null;
  currentUser: AdminUser;
}) {
  const { header, openModal } = useUI();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-default bg-bg-surface px-7">
      <div className="flex min-w-0 items-center gap-3">
        {header.backHref && (
          <Link
            href={header.backHref}
            className="flex items-center gap-1 rounded-md border border-border-default bg-bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary"
          >
            <ChevronLeft className="size-3.5" />
            {header.backLabel ?? "Back"}
          </Link>
        )}
        <h1 className="truncate text-xl font-semibold tracking-[-0.01em]">{header.title}</h1>
        {header.pills?.map((pill) => (
          <span
            key={pill.label}
            className={cn(
              "shrink-0 rounded-md border border-border-default bg-bg-surface-secondary px-2.5 py-1 text-xs font-medium text-text-secondary",
              pill.tone === "warn" && "border-warning-default bg-warning-subtle text-warning-subtle-text"
            )}
          >
            {pill.label}
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-3.5">
        {activeAudit && <LiveAuditPill audit={activeAudit} />}
        {header.action &&
          (header.action.href ? (
            <Button render={<Link href={header.action.href} />} nativeButton={false}>
              {header.action.icon}
              {header.action.label}
            </Button>
          ) : (
            <Button onClick={() => header.action?.modal && openModal(header.action.modal)}>
              {header.action.icon}
              {header.action.label}
            </Button>
          ))}
        <ProfileMenu name={currentUser.name} email={currentUser.email} />
      </div>
    </header>
  );
}
