"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"

type Phase = "intro" | "question" | "result"

const MOCK_QUESTIONS = [
  { id: 1, text: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"] },
  { id: 2, text: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"] },
  { id: 3, text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"] },
]

export default function BaselinePage() {
  const router = useRouter()
  const [phase, setPhase] = React.useState<Phase>("intro")
  const [currentQIndex, setCurrentQIndex] = React.useState(0)
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null)

  const handleNext = () => {
    if (currentQIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1)
      setSelectedOption(null)
    } else {
      setPhase("result")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <TopNav showProfile={true} showNotification={true} title="Apna Rank" />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-[600px] w-full mx-auto">
        {phase === "intro" && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-[40px]">🎯</span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#0F172A] tracking-tight">
              Let&apos;s find your starting level
            </h1>
            <p className="text-[16px] text-[#64748B] font-medium max-w-[300px] mx-auto">
              Just 5-7 questions, no timer. This helps us personalize your daily tasks.
            </p>
            <div className="pt-4">
              <Button
                onClick={() => setPhase("question")}
                className="w-full h-[56px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
              >
                Start Diagnosis
              </Button>
            </div>
          </div>
        )}

        {phase === "question" && (
          <div className="w-full space-y-8 animate-in slide-in-from-right-4 fade-in">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[14px] font-medium text-[#64748B]">
                <span>Question {currentQIndex + 1} of {MOCK_QUESTIONS.length}</span>
              </div>
              <ProgressBar value={((currentQIndex + 1) / MOCK_QUESTIONS.length) * 100} className="h-2" />
            </div>

            <h2 className="text-[22px] md:text-[24px] font-bold text-[#0F172A] leading-relaxed">
              {MOCK_QUESTIONS[currentQIndex].text}
            </h2>

            <div className="space-y-3">
              {MOCK_QUESTIONS[currentQIndex].options.map((option, idx) => {
                const isSelected = selectedOption === option
                return (
                  <Card
                    key={idx}
                    onClick={() => setSelectedOption(option)}
                    className={`p-4 rounded-[12px] cursor-pointer transition-all border-[2px] ${
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]"
                        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-[2px] flex items-center justify-center ${
                        isSelected ? "border-[#4F46E5]" : "border-[#CBD5E1]"
                      }`}>
                        {isSelected && <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />}
                      </div>
                      <span className={`text-[16px] font-semibold ${isSelected ? "text-[#312E81]" : "text-[#334155]"}`}>
                        {option}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>

            <Button
              onClick={handleNext}
              disabled={!selectedOption}
              className="w-full h-[56px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
            >
              {currentQIndex === MOCK_QUESTIONS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        )}

        {phase === "result" && (
          <div className="w-full text-center space-y-8 animate-in fade-in zoom-in-95">
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#0F172A] tracking-tight">
              Diagnosis Complete!
            </h1>
            
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#EEF2FF" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="#4F46E5" strokeWidth="8" fill="none" 
                  strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.65)} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[36px] font-black text-[#312E81]">65%</span>
                <span className="text-[14px] font-medium text-[#64748B]">Readiness</span>
              </div>
            </div>

            <Card className="p-5 text-left bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border-[1.5px] border-[#FB923C] border-l-[4px] border-l-[#F97316] rounded-[14px]">
              <h3 className="text-[14px] font-bold text-[#C2410C] uppercase tracking-wide mb-1">Your First Task</h3>
              <p className="text-[16px] font-bold text-[#431407]">
                Practice 15 Algebra questions to build your foundation.
              </p>
            </Card>

            <Button
              onClick={() => router.push("/student/home")}
              className="w-full h-[56px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
