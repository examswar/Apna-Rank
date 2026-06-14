"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { CheckCircle, XCircle, Sparkles, BookOpen, ChevronDown, ChevronUp } from "lucide-react"

const FILTERS = ["All", "Correct", "Wrong", "Skip", "Flagged"]

const MOCK_QUESTIONS = [
  {
    id: 1,
    num: 1,
    text: "Which of the following describes the relationship between the marginal propensity to consume (MPC) and the marginal propensity to save (MPS)?",
    options: ["MPC + MPS = 0", "MPC + MPS = 1", "MPC / MPS = 1", "MPC - MPS = 1"],
    userAns: "MPC + MPS = 1",
    correctAns: "MPC + MPS = 1",
    status: "correct",
    explanation: "In economics, the Marginal Propensity to Consume (MPC) plus the Marginal Propensity to Save (MPS) always equals 1 because any additional income must be either consumed or saved.",
  },
  {
    id: 2,
    num: 2,
    text: "Find the missing number in the series: 3, 8, 15, 24, __, 48",
    options: ["32", "34", "35", "36"],
    userAns: "34",
    correctAns: "35",
    status: "wrong",
    dna: "calc",
    dnaLabel: "Calc Slip",
    dnaColor: "bg-[#FFEDD5] text-[#C2410C]",
    explanation: "The differences between consecutive terms are 5, 7, 9... So the next difference should be 11. 24 + 11 = 35. You made a calculation error.",
  }
]

export default function QuestionReviewPage() {
  const router = useRouter()
  const [filter, setFilter] = React.useState("All")
  const [expandedId, setExpandedId] = React.useState<number | null>(null)

  const filteredQs = MOCK_QUESTIONS.filter(q => {
    if (filter === "All") return true
    if (filter === "Correct" && q.status === "correct") return true
    if (filter === "Wrong" && q.status === "wrong") return true
    return false
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav showProfile={true} showNotification={true} title="Question Review" showBack onBack={() => router.push("/student/result")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`snap-start whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-[14px] transition-all border-[1.5px] ${
                filter === f 
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-md" 
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQs.map((q) => {
            const isExpanded = expandedId === q.id
            const isWrong = q.status === "wrong"
            
            return (
              <Card key={q.id} className="p-0 border-[#E2E8F0] shadow-sm rounded-[16px] bg-white overflow-hidden">
                <div className="p-5 md:p-6">
                  
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[18px] font-bold text-[#0F172A] leading-relaxed">
                      <span className="text-[#94A3B8] font-mono mr-2">Q{q.num}.</span>
                      {q.text}
                    </h4>
                    {isWrong && q.dna && (
                      <div className={`shrink-0 ml-4 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${q.dnaColor}`}>
                        {q.dnaLabel}
                      </div>
                    )}
                  </div>

                  {/* Answer Comparison */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4 rounded-[12px] bg-[#F8FAFC] border border-[#F1F5F9]">
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-[#64748B] uppercase mb-1">Your Answer</div>
                      <div className={`flex items-start text-[15px] font-bold ${isWrong ? "text-[#EF4444]" : "text-[#10B981]"}`}>
                        {isWrong ? <XCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" /> : <CheckCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />}
                        {q.userAns}
                      </div>
                    </div>
                    {isWrong && (
                      <>
                        <div className="w-[1px] bg-[#E2E8F0] hidden sm:block"></div>
                        <div className="flex-1">
                          <div className="text-[12px] font-bold text-[#64748B] uppercase mb-1">Correct Answer</div>
                          <div className="flex items-start text-[15px] font-bold text-[#10B981]">
                            <CheckCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                            {q.correctAns}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions & AI Explanation */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-[#E2E8F0] pt-4">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="flex-1 min-w-[200px] flex items-center justify-between p-3 rounded-[10px] bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] font-bold text-[14px] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> AI Explanation
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {isWrong ? (
                      <Button variant="secondary" className="flex-1 h-[44px] text-[13px] bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]" disabled>
                        <CheckCircle className="w-4 h-4 mr-2 text-[#10B981]" /> Auto-added to Notebook
                      </Button>
                    ) : (
                      <Button variant="secondary" className="flex-1 h-[44px] text-[13px] bg-white border-[1.5px] border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1] hover:text-[#0F172A]">
                        <BookOpen className="w-4 h-4 mr-2" /> Add to Notebook
                      </Button>
                    )}
                  </div>

                  {/* Collapsible Explanation */}
                  {isExpanded && (
                    <div className="mt-4 p-5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] animate-in slide-in-from-top-2 fade-in duration-200">
                      <p className="text-[15px] text-[#334155] leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                      <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                        <button className="text-[14px] font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Ask Doubt Solver to simplify this
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
