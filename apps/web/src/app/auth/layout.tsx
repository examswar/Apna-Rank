import * as React from "react"
import Link from "next/link"
import { Rocket } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-[420px]">
        {/* Logo at the top */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="group flex flex-col justify-center text-center">
            <div className="flex items-center gap-1.5 justify-center">
              <Rocket className="w-8 h-8 text-[#4F46E5]" />
              <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#4F46E5] transition-colors">
                Apna Rank
              </h1>
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
