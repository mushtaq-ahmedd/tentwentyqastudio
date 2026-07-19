import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/** Mirrors `.badge` / `.badge-*` in components.css — severity + finding-status pills. */
const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em]",
  {
    variants: {
      variant: {
        critical: "bg-error-subtle text-error-subtle-text",
        high: "bg-warning-subtle text-warning-subtle-text",
        medium: "bg-info-subtle text-info-subtle-text",
        low: "border border-border-default bg-bg-surface-secondary text-text-secondary",
        new: "bg-info-subtle text-info-subtle-text",
        accepted: "bg-success-subtle text-success-subtle-text",
        rejected: "bg-bg-surface-secondary text-text-secondary",
        neutral: "bg-bg-surface-secondary text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
