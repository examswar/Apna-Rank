import * as React from "react"
import { cn } from "@/lib/utils"

export function PageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm", className)}>
      <div 
        className="w-[40px] h-[40px] rounded-full animate-spin"
        style={{
          border: "3px solid #E2E8F0",
          borderTopColor: "#4F46E5",
        }}
      />
    </div>
  )
}
