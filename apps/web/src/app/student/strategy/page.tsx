"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Card } from "@/components/ui/Card"
import { AlertTriangle, Clock, Target, ArrowRight } from "lucide-react"

export default function StrategyScoreDetailPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav showProfile={true} showNotification={true} title="Strategy Score" showBack onBack={() => router.push("/student/result")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Core Ranks */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 border-[#E2E8F0] shadow-sm rounded-[20px] text-center bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DCFCE7] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Knowledge Rank</div>
            <div className="text-[40px] md:text-[48px] font-black font-mono text-[#10B981] leading-none mb-1">
              Top 20%
            </div>
            <p className="text-[14px] font-medium text-[#475569] mt-3">
              What you actually know compared to peers.
            </p>
          </Card>

          <Card className="p-6 border-[#E2E8F0] shadow-sm rounded-[20px] text-center bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEE2E2] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            <div className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Strategy Rank</div>
            <div className="text-[40px] md:text-[48px] font-black font-mono text-[#EF4444] leading-none mb-1">
              Top 60%
            </div>
            <p className="text-[14px] font-medium text-[#475569] mt-3">
              How well you deploy that knowledge in exams.
            </p>
          </Card>
        </div>

        {/* Warning Alert */}
        <Card className="p-6 bg-gradient-to-r from-[#FFFBEB] to-white border border-[#FDE68A] shadow-sm rounded-[16px]">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#92400E] mb-2">
                You are losing marks to strategy, not knowledge.
              </h3>
              <p className="text-[15px] font-medium text-[#B45309] leading-relaxed">
                Your knowledge is excellent (Top 20%), but poor exam strategy is dragging your final score down to Top 60%. If you fix these structural errors, your score will jump immediately.
              </p>
            </div>
          </div>
        </Card>

        {/* Specific Issues List */}
        <h3 className="text-[20px] font-bold text-[#0F172A] pt-4">Where you lost marks today</h3>
        <div className="space-y-4">
          
          <Card className="p-5 border-[#E2E8F0] shadow-sm rounded-[16px] flex gap-4 bg-white items-start">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#0F172A] mb-1">Ego Battles on Hard Questions</h4>
              <p className="text-[15px] font-medium text-[#475569] mb-3">
                You spent <span className="font-bold text-[#0F172A]">180 seconds</span> on average on hard questions, vs the recommended <span className="font-bold text-[#10B981]">60 seconds</span>.
              </p>
              <div className="bg-[#F8FAFC] p-3 rounded-[10px] text-[14px] font-medium text-[#334155] flex items-start gap-2 border border-[#E2E8F0]">
                <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <span>Action: Skip if you can't see the path in 30 seconds. Come back later.</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-[#E2E8F0] shadow-sm rounded-[16px] flex gap-4 bg-white items-start">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[16px] font-bold text-[#0F172A] mb-1">Negative Marking Penalties</h4>
              <p className="text-[15px] font-medium text-[#475569] mb-3">
                You lost <span className="font-bold text-[#0F172A]">4.5 marks</span> to pure blind guesses.
              </p>
              <div className="bg-[#F8FAFC] p-3 rounded-[10px] text-[14px] font-medium text-[#334155] flex items-start gap-2 border border-[#E2E8F0]">
                <ArrowRight className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <span>Action: Only guess if you can eliminate at least two options.</span>
              </div>
            </div>
          </Card>

        </div>
      </main>
    </div>
  )
}
