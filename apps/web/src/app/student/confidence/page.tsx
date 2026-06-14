"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Card } from "@/components/ui/Card"
import { CheckCircle, XCircle, HelpCircle, Sparkles, Lightbulb } from "lucide-react"

export default function ConfidenceCalibrationDetailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav showProfile={true} showNotification={true} title="Confidence Calibration" showBack onBack={() => router.push("/student/result")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Key Insight */}
        <Card className="p-6 bg-white border border-[#E2E8F0] border-l-[6px] border-l-[#EF4444] shadow-md rounded-[16px] animate-in fade-in zoom-in-95">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center shrink-0">
              <Lightbulb className="w-6 h-6 text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-[#0F172A] mb-2 leading-tight">
                Your biggest blind spot is Overconfidence.
              </h3>
              <p className="text-[16px] font-medium text-[#475569] leading-relaxed">
                You were "Sure" about <strong className="text-[#EF4444]">8 questions</strong> that turned out to be wrong. This means you have fundamental concept flaws that you aren't aware of.
              </p>
            </div>
          </div>
        </Card>

        {/* 2x2 Grid */}
        <h3 className="text-[18px] font-bold text-[#0F172A] pt-4">Your Confidence Matrix</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <Card className="p-6 bg-[#F0FDF4] border border-[#BBF7D0] shadow-sm rounded-[16px] flex flex-col justify-between h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                <span className="font-bold text-[#166534] text-[15px] uppercase tracking-wide">Ideal</span>
              </div>
              <span className="text-[32px] font-black font-mono text-[#15803D]">45</span>
            </div>
            <p className="text-[14px] font-bold text-[#166534]">Sure + Correct</p>
          </Card>

          <Card className="p-6 bg-[#FEF2F2] border border-[#FECACA] shadow-sm rounded-[16px] flex flex-col justify-between h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-[#DC2626]" />
                <span className="font-bold text-[#991B1B] text-[15px] uppercase tracking-wide">Overconfident</span>
              </div>
              <span className="text-[32px] font-black font-mono text-[#B91C1C]">8</span>
            </div>
            <p className="text-[14px] font-bold text-[#991B1B]">Sure + Wrong</p>
          </Card>

          <Card className="p-6 bg-[#FFFBEB] border border-[#FDE68A] shadow-sm rounded-[16px] flex flex-col justify-between h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#D97706]" />
                <span className="font-bold text-[#92400E] text-[15px] uppercase tracking-wide">Underconfident</span>
              </div>
              <span className="text-[32px] font-black font-mono text-[#B45309]">12</span>
            </div>
            <p className="text-[14px] font-bold text-[#92400E]">Unsure + Correct</p>
          </Card>

          <Card className="p-6 bg-[#F1F5F9] border border-[#E2E8F0] shadow-sm rounded-[16px] flex flex-col justify-between h-[140px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#475569]" />
                <span className="font-bold text-[#334155] text-[15px] uppercase tracking-wide">Lucky</span>
              </div>
              <span className="text-[32px] font-black font-mono text-[#475569]">4</span>
            </div>
            <p className="text-[14px] font-bold text-[#334155]">Guess + Correct</p>
          </Card>

        </div>

      </main>
    </div>
  )
}
