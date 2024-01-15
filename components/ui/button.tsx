import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        muted: "bg-[#21232B] border-2 border-white/10 text-white",
        option: "bg-black/70",
        "option-muted": "bg-black/30 text-white/50",
        success: "bg-success border-2 border-white/10 text-white",
        error: "bg-error/75 border-2 border-white/10 text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        action: "action-gradient rounded-md text-white",
        "action-muted": "action-gradient-muted rounded-md text-white/50",
        link: "text-primary underline-offset-4 hover:underline",
        create:
          "bg-[#2F2F2F] border-none hover:border-none hover:bg-[#2F2F2F] focus:border-none focus:bg-[#2F2F2F] focus:ring-0 focus:ring-offset-0 focus:ring-transparent",
        "table-tab": "text-primary font-bold text-xs",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
