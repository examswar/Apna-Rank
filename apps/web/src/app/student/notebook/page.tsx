"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { BottomTabBar } from "@/components/navigation/BottomTabBar"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Check, BookOpen, AlertTriangle, Search } from "lucide-react"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "unreviewed", label: "Unreviewed" },
  { id: "concept", label: "Concept", color: "bg-[#FEE2E2] text-[#B91C1C]" },
  { id: "calc", label: "Calc Slip", color: "bg-[#FFEDD5] text-[#C2410C]" },
  { id: "misread", label: "Misread", color: "bg-[#FEF9C3] text-[#92400E]" },
  { id: "time", label: "Time", color: "bg-[#EDE9FE] text-[#6D28D9]" },
  { id: "guess", label: "Guess", color: "bg-[#F1F5F9] text-[#475569]" },
]

const MOCK_MISTAKES = [
  {
    id: 1,
    text: "A shopkeeper marks his goods 20% above cost price and allows a discount of 10%...",
    dna: "calc",
    dnaLabel: "Calc Slip",
    dnaColor: "bg-[#FFEDD5] text-[#C2410C]",
    subject: "Profit & Loss",
    date: "14 Jun",
    reviews: 0,
    resolved: false
  },
  {
    id: 2,
    text: "The fundamental rights can be suspended during...",
    dna: "concept",
    dnaLabel: "Concept",
    dnaColor: "bg-[#FEE2E2] text-[#B91C1C]",
    subject: "Polity",
    date: "12 Jun",
    reviews: 2,
    resolved: false
  },
  {
    id: 3,
    text: "Which of the following elements is a metalloid?",
    dna: "misread",
    dnaLabel: "Misread",
    dnaColor: "bg-[#FEF9C3] text-[#92400E]",
    subject: "Chemistry",
    date: "10 Jun",
    reviews: 1,
    resolved: true
  }
]

export default function MistakeNotebookPage() {
  const router = useRouter()
  const [filter, setFilter] = React.useState("all")
  const [mistakes, setMistakes] = React.useState(MOCK_MISTAKES)

  const handleResolve = (id: number) => {
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, resolved: true } : m))
  }

  const filteredMistakes = mistakes.filter(m => {
    if (filter === "all") return true
    if (filter === "unreviewed") return m.reviews === 0 && !m.resolved
    if (filter === m.dna) return true
    return false
  }).sort((a, b) => Number(a.resolved) - Number(b.resolved)) // Resolved at bottom

  const total = mistakes.length
  const resolved = mistakes.filter(m => m.resolved).length
  const toReview = total - resolved

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[80px]">
      <TopNav showProfile={true} showNotification={true} title="Mistake Notebook" showBack onBack={() => router.push("/student/home")} />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Pre-Exam Banner */}
        <Card className="bg-gradient-to-r from-[#FFFBEB] to-white border border-[#FDE68A] p-4 flex items-center gap-4 rounded-[12px] shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#B45309]">Exam in 12 days!</p>
            <p className="text-[13px] font-medium text-[#92400E]">Review your most important mistakes before the big day.</p>
          </div>
        </Card>

        {/* Stats Bar */}
        <div className="flex bg-white border border-[#E2E8F0] shadow-sm rounded-[12px] overflow-hidden divide-x divide-[#E2E8F0]">
          <div className="flex-1 p-3 text-center">
            <div className="text-[20px] font-black font-mono text-[#0F172A] leading-tight">{total}</div>
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Total Mistakes</div>
          </div>
          <div className="flex-1 p-3 text-center bg-[#F8FAFC]">
            <div className="text-[20px] font-black font-mono text-[#EF4444] leading-tight">{toReview}</div>
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">To Review</div>
          </div>
          <div className="flex-1 p-3 text-center">
            <div className="text-[20px] font-black font-mono text-[#10B981] leading-tight">{resolved}</div>
            <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {CATEGORIES.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`snap-start whitespace-nowrap px-4 py-2 rounded-full font-bold text-[13px] transition-all border-[1.5px] ${
                filter === f.id 
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-md" 
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search mistakes by keyword or topic..."
            className="w-full h-[52px] pl-12 pr-4 rounded-[12px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/20 bg-white"
          />
        </div>

        {/* Mistake List */}
        <div className="space-y-4">
          {filteredMistakes.map((m) => (
            <Card key={m.id} className={`p-5 rounded-[16px] shadow-sm transition-opacity duration-300 ${m.resolved ? "opacity-60 bg-[#F8FAFC] border-dashed" : "bg-white border-[#E2E8F0]"}`}>
              <div className="flex gap-2 items-center mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${m.dnaColor}`}>
                  {m.dnaLabel}
                </span>
                <span className="text-[#94A3B8] text-[12px] font-bold">•</span>
                <span className="text-[#64748B] text-[12px] font-bold">{m.subject}</span>
                <span className="text-[#94A3B8] text-[12px] font-bold">•</span>
                <span className="text-[#64748B] text-[12px] font-bold">{m.date}</span>
              </div>
              
              <p className={`text-[16px] font-medium leading-relaxed mb-5 ${m.resolved ? "text-[#64748B] line-through decoration-[#CBD5E1]" : "text-[#0F172A]"}`}>
                "{m.text}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <div className="text-[13px] font-bold text-[#64748B]">
                  Reviewed: <span className="text-[#0F172A]">{m.reviews} times</span>
                </div>
                <div className="flex gap-2">
                  {!m.resolved && (
                    <Button 
                      onClick={() => handleResolve(m.id)}
                      variant="secondary" 
                      className="h-[36px] px-3 bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#10B981] hover:border-[#10B981] text-[13px] font-bold"
                    >
                      <Check className="w-4 h-4 mr-1.5" /> Resolve
                    </Button>
                  )}
                  <Button className="h-[36px] px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-bold">
                    <BookOpen className="w-4 h-4 mr-1.5" /> Review Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredMistakes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-[#F1F5F9] rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#0F172A] mb-1">No mistakes here!</h3>
              <p className="text-[14px] text-[#64748B] font-medium">Keep taking tests and checking your diagnosis.</p>
            </div>
          )}
        </div>
      </main>

      <BottomTabBar />
    </div>
  )
}
