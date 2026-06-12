import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  "w-full transition-all duration-150",
  {
    variants: {
      variant: {
        standard: "bg-white border border-[#E2E8F0] rounded-[14px] shadow-md p-5",
        hero: "bg-gradient-to-br from-[#4F46E5] to-[#4338CA] text-white rounded-[20px] p-6 shadow-[0_8px_24px_rgba(79,70,229,0.25)]",
        task: "bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border-[1.5px] border-[#FB923C] border-l-[4px] border-l-[#F97316] rounded-[14px] p-5",
        diagnosis: "bg-white border border-[#E2E8F0] border-l-[4px] rounded-[14px] p-4",
      },
    },
    defaultVariants: {
      variant: "standard",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  borderColor?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, borderColor, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        style={{
          ...style,
          ...(variant === "diagnosis" && borderColor ? { borderLeftColor: borderColor } : {}),
        }}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

export { Card, cardVariants }
