import { cn } from "@/lib/utils"

export function BrandMark({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/assets/lbid-web-logo-clean.png?v=20260621"
        alt="LBID"
        className={cn("h-10 w-[150px] object-contain", markClassName)}
      />
    </span>
  )
}
