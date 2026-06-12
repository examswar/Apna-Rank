import * as React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-[#E2E8F0]",
          className
        )}
        {...props}
      >
        <div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
          style={{ animation: "shimmer 1.5s infinite" }}
        />
      </div>
    </>
  )
}
