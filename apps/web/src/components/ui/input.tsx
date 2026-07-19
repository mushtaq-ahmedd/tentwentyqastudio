import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/** Mirrors `.field input[type=text]` in components.css. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-auto w-full min-w-0 rounded-control border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus-visible:border-accent-default focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-accent-default disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
