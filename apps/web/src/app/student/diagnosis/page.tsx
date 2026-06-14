"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Card } from "@/components/ui/Card"
import { ChevronRight, XCircle, CheckCircle, BookOpen, FileText } from "lucide-react"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "concept", label: "Concept", color: "bg-[#FEE2E2] text-[#B91C1C]" },
  { id: "calc", label: "Calc Slip", color: "bg-[#FFEDD5] text-[#C2410C]" },
  { id: "misread", label: "Misread", color: "bg-[#FEF9C3] text-[#92400E]" },
  { id: "time", label: "Time", color: "bg-[#EDE9FE] text-[#6D28D9]" },
  { id: "guess", label: "Guess", color: "bg-[#F1F5F9] text-[#475569]" },
]

const MOCK_MISTAKES = [
  {
    id: 1,
    qNum: 14,
    text: "If a sum of money doubles itself in 8 years at simple interest, the rate of interest per annum is?",
    userAns: "12%",
    correctAns: "12.5%",
    dna: "concept",
    topic: "Simple Interest",
  },
  {
    id: 2,
    qNum: 22,
    text: "What is the value of (2.3)^3 - (1.7)^3 / (2.3)^2 + 2.3*1.7 + (1.7)^2 ?",
    userAns: "0.5",
    correctAns: "0.6",
    dna: "calc",
    topic: "Algebra",
  },
  {
    id: 3,
    qNum: 45,
    text: "Which of the following is NOT a fundamental right?",
    userAns: "Right to Equality",
    correctAns: "Right to Property",
    dna: "misread",
    topic: "Polity",
  },
]

export default function MistakeDNADetailPage() {
  const router = useRouter()
  const [filter, setFilter] = React.useState("all")

  const filteredMistakes = MOCK_MISTAKES.filter(m => filter === "all" || m.dna === filter)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav showProfile={true} showNotification={true} title="Mistake DNA" showBack onBack={() => router.push("/student/result")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Animated Summary Card */}
        <Card className="bg-white border-[#E2E8F0] shadow-md p-6 rounded-[20px] overflow-hidden relative isolate">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FEE2E2] rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <h2 className="text-[22px] font-black text-[#0F172A] tracking-tight mb-2">
            Your biggest problem: <span className="text-[#B91C1C]">Concept</span>
          </h2>
          <p className="text-[16px] font-medium text-[#475569] leading-relaxed max-w-[500px]">
            You made <strong className="text-[#0F172A]">12 concept errors</strong> in this test. 
            Revise <span className="underline decoration-[#FCA5A5] decoration-2 underline-offset-4">Simple Interest</span> and <span className="underline decoration-[#FCA5A5] decoration-2 underline-offset-4">Trigonometry</span> to instantly boost your score.
          </p>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-[14px] transition-all border-[1.5px] ${
                filter === cat.id 
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-md" 
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Mistake List */}
        <div className="space-y-4">
          {filteredMistakes.map((mistake) => {
            const dnaCategory = CATEGORIES.find(c => c.id === mistake.dna)
            
            return (
              <Card 
                key={mistake.id} 
                className="bg-white border-[#E2E8F0] shadow-sm rounded-[16px] overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Colored Left Border handled via standard border-left in Tailwind, but dynamic */}
                <div className="p-5 relative">
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${dnaCategory?.color?.split(' ')[0] || 'bg-slate-200'}`} />
                  
                  <div className="pl-3">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h4 className="text-[16px] font-bold text-[#0F172A] leading-snug">
                        <span className="text-[#94A3B8] font-mono mr-2">Q{mistake.qNum}.</span>
                        {mistake.text}
                      </h4>
                      <div className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${dnaCategory?.color}`}>
                        {dnaCategory?.label}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4 rounded-[12px] bg-[#F8FAFC] border border-[#F1F5F9]">
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-[#64748B] uppercase mb-1">Your Answer</div>
                        <div className="flex items-center text-[15px] font-bold text-[#EF4444]">
                          <XCircle className="w-5 h-5 mr-2 shrink-0" />
                          {mistake.userAns}
                        </div>
                      </div>
                      <div className="w-[1px] bg-[#E2E8F0] hidden sm:block"></div>
                      <div className="flex-1">
                        <div className="text-[12px] font-bold text-[#64748B] uppercase mb-1">Correct Answer</div>
                        <div className="flex items-center text-[15px] font-bold text-[#10B981]">
                          <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                          {mistake.correctAns}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] font-bold text-[14px] transition-colors">
                        <FileText className="w-4 h-4" /> Explanation
                      </button>
                      <button 
                        onClick={() => router.push("/student/notebook")}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-white border-[1.5px] border-[#E2E8F0] text-[#475569] hover:text-[#0F172A] hover:border-[#CBD5E1] font-bold text-[14px] transition-colors"
                      >
                        <BookOpen className="w-4 h-4" /> View in Notebook
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredMistakes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[48px] mb-4">🎉</div>
              <h3 className="text-[18px] font-bold text-[#0F172A]">No mistakes found here!</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
