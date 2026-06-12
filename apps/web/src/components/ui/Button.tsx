import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[rgba(79,70,229,0.25)] active:translate-y-0 active:shadow-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] disabled:border-transparent",
  {
    variants: {
      variant: {
        primary:
          "bg-[#4F46E5] text-white font-semibold rounded-full hover:-translate-y-[1px] hover:shadow-lg hover:bg-[#4338CA]",
        secondary:
          "bg-transparent border-2 border-[#4F46E5] text-[#4F46E5] font-semibold rounded-full hover:-translate-y-[1px] hover:shadow-lg hover:bg-[#EEF2FF]",
        ghost:
          "bg-transparent text-[#4F46E5] font-medium hover:bg-[#EEF2FF] hover:text-[#4338CA] rounded-[10px]",
        danger:
          "bg-[#EF4444] text-white font-semibold rounded-full hover:-translate-y-[1px] hover:shadow-lg hover:bg-[#B91C1C]",
        cta:
          "w-full bg-[#4F46E5] text-white font-semibold rounded-full hover:-translate-y-[1px] hover:shadow-lg hover:bg-[#4338CA] text-[18px] h-[56px]",
      },
      size: {
        default: "h-[48px] px-6 text-base",
        ghost: "py-2 px-3 text-sm",
        cta: "h-[56px] text-[18px] px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
