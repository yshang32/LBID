import * as React from "react"

import { cn } from "@/lib/utils"

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-lblue/[0.12] bg-white/[0.92] px-3 py-2 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_18px_rgba(27,43,94,0.04)] focus-visible:border-lgold/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lgold/25",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
