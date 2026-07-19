"use client";

import Link from "next/link";
import { Plus, Play, Shapes, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useUI } from "@/components/shell/ui-provider";

function QuickAction({ icon, label, ...linkProps }: { icon: React.ReactNode; label: string; href?: string; onClick?: () => void }) {
  const className =
    "flex items-center gap-2.5 rounded-md border border-border-default bg-bg-surface px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-bg-hover hover:border-border-strong [&_svg]:size-[15px] [&_svg]:text-text-secondary";
  if (linkProps.href) {
    return (
      <Link href={linkProps.href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={linkProps.onClick}>
      {icon}
      {label}
    </button>
  );
}

export function QuickActionsCard({
  latestReportHref,
  latestFindingsHref,
  primaryProjectId,
}: {
  latestReportHref: string;
  latestFindingsHref: string;
  primaryProjectId: string | null;
}) {
  const { openModal } = useUI();

  return (
    <Card>
      <CardTitle>Quick Actions</CardTitle>
      <CardContent className="flex flex-col gap-2">
        <QuickAction icon={<Plus />} label="Create Project" onClick={() => openModal("create-project")} />
        <QuickAction icon={<Play />} label="Run Audit" href="/audit-center" />
        <QuickAction
          icon={<Shapes />}
          label="Connect Figma"
          onClick={() => primaryProjectId && openModal("connect-figma", { projectId: primaryProjectId })}
        />
        <QuickAction icon={<FileText />} label="Open Latest Report" href={latestReportHref} />
        <QuickAction icon={<AlertTriangle />} label="Review Latest Findings" href={latestFindingsHref} />
      </CardContent>
    </Card>
  );
}
