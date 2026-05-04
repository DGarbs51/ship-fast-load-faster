import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-1 text-base text-zinc-950 shadow-none ring-1 ring-zinc-950/5 transition-[color,box-shadow,border-color] outline-hidden selection:bg-emerald-400 selection:text-zinc-950 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-950 placeholder:text-zinc-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:ring-white/10 dark:file:text-white dark:placeholder:text-zinc-500",
        "focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400/40",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
