import { cn } from "@/lib/utils"

export function BrandMark({ className, markClassName, wordClassName }: { className?: string; markClassName?: string; wordClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/assets/lbid-logo-primary.svg"
        alt=""
        aria-hidden="true"
        className={cn("h-9 w-9 object-contain", markClassName)}
      />
      <span className={cn("text-2xl font-black tracking-[0.18em] text-lblue", wordClassName)}>LBID</span>
    </span>
  )
}
