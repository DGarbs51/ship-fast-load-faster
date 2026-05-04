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
          "border-transparent bg-emerald-400 text-zinc-950 [a&]:hover:bg-emerald-300",
        secondary:
          "border-amber-200 bg-amber-50 text-amber-800 [a&]:hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
        destructive:
          "border-red-200 bg-red-50 text-red-700 [a&]:hover:bg-red-100 focus-visible:ring-destructive/20 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200 dark:focus-visible:ring-destructive/40",
        outline:
          "border-zinc-200 bg-white text-zinc-700 [a&]:hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:[a&]:hover:bg-white/10",
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
