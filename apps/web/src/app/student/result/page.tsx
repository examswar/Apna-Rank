"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ChevronRight, ArrowRight, PlayCircle, BookOpen, AlertTriangle } from "lucide-react"

export default function TestResultOverviewPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-8">
      <TopNav showProfile={true} showNotification={true} title="Test Result" showBack onBack={() => router.push("/student/home")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Score Card (Hero) */}
        <Card className="bg-gradient-to-br from-[#4F46E5] to-[#4338CA] text-white p-8 border-none shadow-[0_8px_24px_rgba(79,70,229,0.25)] rounded-[20px] text-center">
          <h2 className="text-[16px] font-bold text-white/80 uppercase tracking-wider mb-2">SSC CGL Mock Test 1</h2>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-[64px] font-mono font-black leading-none">120</span>
            <span className="text-[24px] font-bold text-white/70">/ 200</span>
          </div>
          <div className="flex items-center justify-center gap-6 text-white/90 font-medium">
            <div className="flex items-center gap-2">
              <span>⏱️ 55 min 30 sec</span>
            </div>
            <div className="w-[1px] h-4 bg-white/20"></div>
            <div>
              <span>Platform Avg: 98/200</span>
            </div>
          </div>
        </Card>

        {/* Mistake DNA Summary */}
        <Card className="p-6 border-[#E2E8F0] shadow-sm rounded-[16px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[20px] font-bold text-[#0F172A]">Mistake DNA Summary</h3>
            <button onClick={() => router.push("/student/diagnosis")} className="text-[#4F46E5] text-[14px] font-bold flex items-center hover:underline">
              Full Detail <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FEE2E2] border border-[#FCA5A5]/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#B91C1C]" />
                <span className="font-bold text-[#B91C1C]">Concept</span>
              </div>
              <span className="font-black font-mono text-[#B91C1C]">12</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FFEDD5] border border-[#FDBA74]/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#C2410C]" />
                <span className="font-bold text-[#C2410C]">Calc Slip</span>
              </div>
              <span className="font-black font-mono text-[#C2410C]">5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FEF9C3] border border-[#FDE047]/30">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#92400E]" />
                <span className="font-bold text-[#92400E]">Misread</span>
              </div>
              <span className="font-black font-mono text-[#92400E]">3</span>
            </div>
          </div>
          <p className="mt-5 text-[15px] font-bold text-[#B91C1C]">Your biggest problem: Concept (12 times)</p>
        </Card>

        {/* Strategy Score & Confidence (Grid on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strategy Score */}
          <Card className="p-6 border-[#E2E8F0] shadow-sm rounded-[16px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-bold text-[#0F172A]">Strategy Score</h3>
                <button onClick={() => router.push("/student/strategy")} className="text-[#4F46E5] text-[14px] font-bold flex items-center hover:underline">
                  Detail <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="flex justify-around mb-6">
                <div className="text-center">
                  <div className="text-[32px] font-black font-mono text-[#10B981]">Top 20%</div>
                  <div className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide">Knowledge Rank</div>
                </div>
                <div className="w-[1px] bg-[#E2E8F0] my-2"></div>
                <div className="text-center">
                  <div className="text-[32px] font-black font-mono text-[#EF4444]">Top 60%</div>
                  <div className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide">Strategy Rank</div>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-[#FFFBEB] p-3 rounded-[10px] border border-[#FDE68A]">
                <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-[13px] font-bold text-[#B45309] leading-tight">
                  Your strategy is lagging behind your knowledge. You are losing marks to strategy, not knowledge.
                </p>
              </div>
            </div>
          </Card>

          {/* Confidence Calibration */}
          <Card className="p-6 border-[#E2E8F0] shadow-sm rounded-[16px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-bold text-[#0F172A]">Confidence</h3>
                <button onClick={() => router.push("/student/confidence")} className="text-[#4F46E5] text-[14px] font-bold flex items-center hover:underline">
                  Detail <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-[#FEF2F2] p-3 rounded-[10px] border border-[#FECACA]">
                  <span className="font-bold text-[#B91C1C]">Overconfident (Sure, but wrong)</span>
                  <span className="font-black font-mono text-[#B91C1C]">8</span>
                </div>
                <div className="flex items-center justify-between bg-[#FEF9C3] p-3 rounded-[10px] border border-[#FEF08A]">
                  <span className="font-bold text-[#A16207]">Underconfident (Guess, but right)</span>
                  <span className="font-black font-mono text-[#A16207]">4</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Aaj Ka Ek Kaam */}
        <Card className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border-[1.5px] border-[#FB923C] border-l-[6px] border-l-[#F97316] p-6 shadow-sm rounded-[16px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#F97316] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Aaj Ka Ek Kaam
                </span>
              </div>
              <h3 className="text-[20px] font-bold text-[#431407] mb-2 leading-tight">
                Review your 12 Concept mistakes in Algebra.
              </h3>
            </div>
            <Button className="w-full md:w-auto h-[48px] px-8 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-full shadow-md whitespace-nowrap group">
              <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Do It Now
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Button 
            onClick={() => router.push("/student/review")}
            variant="secondary" 
            className="h-[60px] bg-white border-[2px] border-[#E2E8F0] text-[#0F172A] font-bold text-[16px]"
          >
            <BookOpen className="w-5 h-5 mr-2 text-[#4F46E5]" />
            Question Review
          </Button>
          <Button 
            onClick={() => router.push("/student/notebook")}
            variant="secondary" 
            className="h-[60px] bg-white border-[2px] border-[#E2E8F0] text-[#0F172A] font-bold text-[16px]"
          >
            <BookOpen className="w-5 h-5 mr-2 text-[#F97316]" />
            Mistake Notebook
          </Button>
        </div>
        <Button 
          onClick={() => router.push("/student/home")}
          variant="secondary" 
          className="w-full h-[60px] bg-transparent border-none text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] font-bold text-[16px]"
        >
          Back to Dashboard
        </Button>

      </main>
    </div>
  )
}
