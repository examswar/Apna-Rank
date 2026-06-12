"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
}

export function ProgressBar({ value, className, ...props }: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value))
  
  // Determine color based on value
  let color = "#EF4444" // 0-40%
  if (clampedValue > 40 && clampedValue <= 70) {
    color = "#F59E0B" // 40-70%
  } else if (clampedValue > 70) {
    color = "#22C55E" // 70-100%
  }

  return (
    <div
      className={cn("h-[8px] w-full bg-[#E2E8F0] rounded-full overflow-hidden", className)}
      {...props}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
