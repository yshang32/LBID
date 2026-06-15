import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-lblue text-primary-foreground shadow-[0_10px_24px_rgba(27,43,94,0.18)] hover:-translate-y-0.5 hover:bg-[#223873]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e9eef8]",
        outline: "border border-lblue/[0.12] bg-white/[0.88] text-lblue shadow-[0_8px_20px_rgba(27,43,94,0.06)] hover:-translate-y-0.5 hover:border-lblue/20 hover:bg-slate-50",
        ghost: "text-lblue hover:bg-secondary",
        gold: "bg-gradient-to-b from-[#d8bc66] to-lgold text-[#171104] shadow-[0_12px_28px_rgba(201,168,76,0.24)] hover:-translate-y-0.5 hover:from-[#dfc777] hover:to-[#bd9b3e]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
