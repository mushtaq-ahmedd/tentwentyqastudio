"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * docs/09-dashboard-ux.md: error states must answer what happened, why, how to recover —
 * and never expose raw stack traces to the user.
 */
export function ErrorState({ reset, subject = "this page" }: { reset: () => void; subject?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-error-default/40 bg-error-subtle/40 px-6 py-14 text-center">
      <AlertTriangle className="mb-1 size-6 text-error-default" />
      <div className="text-sm font-semibold text-text-primary">Something went wrong loading {subject}</div>
      <p className="max-w-sm text-[13px] text-text-secondary">
        The request couldn&apos;t be completed. This is usually temporary — try again, and if it keeps
        happening, let your QA Lead know.
      </p>
      <div className="mt-3">
        <Button variant="secondary" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
