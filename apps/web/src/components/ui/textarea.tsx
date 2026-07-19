import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-control border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus-visible:border-accent-default focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent-default disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
