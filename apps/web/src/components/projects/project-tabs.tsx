"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "knowledge", label: "Knowledge" },
  { segment: "environments", label: "Environments" },
  { segment: "testing", label: "Testing" },
  { segment: "reports", label: "Reports" },
  { segment: "history", label: "History" },
  { segment: "settings", label: "Settings" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <div className="flex gap-1 border-b border-border-default">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "-mb-px mr-6 border-b-2 border-transparent px-0.5 py-2.5 text-[13px] font-medium text-text-secondary transition-colors last:mr-0 hover:text-text-primary",
              active && "border-accent-default text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
