import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow,background-color] focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400/40 [&>svg]:pointer-events-none [&>svg]:size-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-500 text-white [a&]:hover:bg-emerald-400 dark:bg-emerald-400 dark:text-zinc-950 dark:[a&]:hover:bg-emerald-300",
        secondary:
          "border-amber-300 bg-amber-100 text-amber-900 [a&]:hover:bg-amber-200 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200 dark:[a&]:hover:bg-amber-400/25",
        destructive:
          "border-red-300 bg-red-100 text-red-800 [a&]:hover:bg-red-200 focus-visible:ring-destructive/20 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200 dark:[a&]:hover:bg-red-500/25 dark:focus-visible:ring-destructive/40",
        outline:
          "border-border bg-muted text-foreground [a&]:hover:bg-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
