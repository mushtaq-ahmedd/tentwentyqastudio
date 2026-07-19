import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Mirrors `.status-chip` / `.status-*` in components.css — audit/run status pills. */
const statusChipVariants = cva(
  "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium",
  {
    variants: {
      variant: {
        completed: "bg-success-subtle text-success-subtle-text",
        running: "bg-info-subtle text-info-subtle-text",
        queued: "bg-bg-surface-secondary text-text-secondary",
        failed: "bg-error-subtle text-error-subtle-text",
      },
    },
    defaultVariants: {
      variant: "queued",
    },
  }
)

function StatusChip({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusChipVariants>) {
  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ variant }), className)}
      {...props}
    />
  )
}

export { StatusChip, statusChipVariants }
