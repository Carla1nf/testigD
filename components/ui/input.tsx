import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  // "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        create: "bg-[#2F2F2F] border-none hover:border-none hover:bg-[#2F2F2F]",
        "create-secondary": "bg-[#342F49] rounded-md text-white border-none hover:border-none",
        action: "action-gradient rounded-md text-white border-none hover:border-none",
        "action-muted": "action-gradient-muted rounded-md text-white/50",
        option: "bg-black/70",
        "option-muted": "bg-black/30 text-white/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, variant, ...props }, ref) => {
  return <input className={cn(inputVariants({ variant, className }))} ref={ref} {...props} />
})

Input.displayName = "Input"

export { Input, inputVariants }
