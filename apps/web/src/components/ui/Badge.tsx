import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-full",
  {
    variants: {
      variant: {
        exam: "bg-[#E0E7FF] text-[#4338CA] text-[12px] uppercase tracking-[0.03em] px-[10px] py-[4px]",
        concept: "bg-[#FEE2E2] text-[#B91C1C] text-[12px] px-[10px] py-[4px]",
        calc: "bg-[#FFEDD5] text-[#C2410C] text-[12px] px-[10px] py-[4px]",
        misread: "bg-[#FEF9C3] text-[#92400E] text-[12px] px-[10px] py-[4px]",
        time: "bg-[#EDE9FE] text-[#6D28D9] text-[12px] px-[10px] py-[4px]",
        guess: "bg-[#F1F5F9] text-[#475569] text-[12px] px-[10px] py-[4px]",
        streak: "bg-[#F97316] text-white text-[14px] font-bold px-[12px] py-[6px]",
        easy: "bg-[#DCFCE7] text-[#15803D] text-[12px] px-[10px] py-[4px]",
        medium: "bg-[#FEF9C3] text-[#B45309] text-[12px] px-[10px] py-[4px]",
        hard: "bg-[#FEE2E2] text-[#B91C1C] text-[12px] px-[10px] py-[4px]",
      },
    },
    defaultVariants: {
      variant: "concept",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
