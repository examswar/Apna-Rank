"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Grid, Flag, ArrowLeft, ArrowRight } from "lucide-react"

export default function TestInProgressPage() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null)
  const [confidence, setConfidence] = React.useState<string | null>(null)
  const [timeLeft, setTimeLeft] = React.useState(3600) // 60 mins
  const [isFlagged, setIsFlagged] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const isLowTime = timeLeft < 300 // under 5 mins

  return (
    <div className="min-h-screen bg-white flex flex-col pb-[80px]">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] px-4 h-[64px] flex items-center justify-between shadow-sm">
        <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-[#475569]">
          <Grid className="w-6 h-6" />
        </button>
        <div className={`font-mono font-bold text-[20px] px-4 py-1.5 rounded-full ${isLowTime ? "bg-[#FEF2F2] text-[#EF4444] animate-pulse" : "bg-[#F1F5F9] text-[#334155]"}`}>
          {formatTime(timeLeft)}
        </div>
        <Button 
          onClick={() => router.push("/student/result")}
          className="h-[40px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold px-4 rounded-[8px]"
        >
          Submit
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[800px] w-full mx-auto p-4 md:p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[14px] font-bold text-[#64748B] uppercase tracking-wider">Question 1 of 100</span>
        </div>

        <h2 className="text-[20px] md:text-[24px] font-medium text-[#0F172A] leading-relaxed mb-8">
          If 15 workers can build a wall in 48 hours, how many workers will be required to do the same work in 30 hours?
        </h2>

        <div className="space-y-3 mb-8">
          {["24 workers", "20 workers", "18 workers", "30 workers"].map((opt) => {
            const isSelected = selectedOption === opt
            return (
              <button
                key={opt}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left p-4 rounded-[12px] border-[2px] transition-colors flex items-center gap-3 ${
                  isSelected 
                    ? "border-[#4F46E5] bg-[#EEF2FF]" 
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center shrink-0 ${
                  isSelected ? "border-[#4F46E5]" : "border-[#CBD5E1]"
                }`}>
                  {isSelected && <div className="w-3 h-3 bg-[#4F46E5] rounded-full" />}
                </div>
                <span className={`text-[16px] font-medium ${isSelected ? "text-[#312E81]" : "text-[#334155]"}`}>
                  {opt}
                </span>
              </button>
            )
          })}
        </div>

        {/* Confidence Tags */}
        <div className="mt-auto">
          <p className="text-[14px] font-bold text-[#64748B] uppercase tracking-wider mb-3">Confidence Level</p>
          <div className="flex gap-3">
            {[
              { id: "sure", label: "Sure", color: "bg-[#DCFCE7] text-[#15803D] border-[#4ADE80]" },
              { id: "unsure", label: "Unsure", color: "bg-[#FEF9C3] text-[#A16207] border-[#FDE047]" },
              { id: "guess", label: "Guess", color: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]" }
            ].map(tag => (
              <button
                key={tag.id}
                onClick={() => setConfidence(tag.id)}
                className={`flex-1 py-3 rounded-[10px] font-bold text-[14px] transition-all border ${
                  confidence === tag.id ? `${tag.color} ring-2 ring-offset-2 ring-[#4F46E5]/30` : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-neutral-50"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Action Row Sticky Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#E2E8F0] p-4 flex gap-3 items-center justify-between z-40 pb-[env(safe-area-inset-bottom,16px)]">
        <Button variant="secondary" className="flex-1 border-[1.5px] border-[#E2E8F0] text-[#475569] h-[52px]">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Prev
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => setIsFlagged(!isFlagged)}
          className={`flex-1 border-[1.5px] h-[52px] ${isFlagged ? "bg-[#FFF7ED] border-[#F97316] text-[#C2410C]" : "border-[#E2E8F0] text-[#475569]"}`}
        >
          <Flag className={`w-5 h-5 mr-2 ${isFlagged ? "fill-current" : ""}`} />
          {isFlagged ? "Flagged" : "Flag"}
        </Button>
        <Button className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white h-[52px]">
          Next
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
