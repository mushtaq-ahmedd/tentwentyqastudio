import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Variant names/values mirror `.btn-*` in html design files/styles/components.css
 * exactly (primary/secondary/outline/text/danger) rather than shadcn's stock set —
 * the prototype's danger button is solid, not tinted, and "text" has no shadcn
 * equivalent.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 justify-center whitespace-nowrap rounded-control text-[13px] font-medium transition-[background-color,border-color,transform] duration-[120ms] outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-accent-default focus-visible:outline-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      size: {
        default: "px-4 py-2.25",
        sm: "px-3 py-1.5 text-xs",
        icon: "size-8 p-0",
      },
      variant: {
        primary: "bg-accent-default text-white hover:bg-accent-hover",
        secondary:
          "border border-border-default bg-bg-surface-secondary text-text-primary hover:bg-bg-hover",
        outline:
          "border border-border-strong bg-transparent text-text-primary hover:bg-bg-hover",
        text: "bg-transparent px-1 text-accent-default hover:underline",
        danger: "bg-error-default text-white hover:bg-red-700",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
