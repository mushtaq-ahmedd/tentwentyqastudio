"use client";

import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Audit } from "@/lib/types";

export function LiveAuditPill({ audit }: { audit: Audit }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={`/audit-center/live/${audit.id}`}
            className="flex items-center gap-2 rounded-full bg-info-subtle px-3 py-1.5 text-xs font-medium text-info-subtle-text"
          />
        }
      >
        <span className="status-dot-live relative inline-block size-1.5 rounded-full bg-info-default" />
        Audit running · <span className="font-mono-tabular font-mono">{audit.progressPercent}%</span>
      </TooltipTrigger>
      <TooltipContent>
        {audit.currentEngine} running on {audit.projectName}
      </TooltipContent>
    </Tooltip>
  );
}
