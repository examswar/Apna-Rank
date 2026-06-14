"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TopNav } from "@/components/navigation/TopNav"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"

const EXAMS = [
  { id: "ssc", name: "SSC", icon: "📋", subtypes: ["CGL", "CHSL", "MTS", "CPO"] },
  { id: "railway", name: "Railway", icon: "🚂", subtypes: ["NTPC", "Group D", "ALP"] },
  { id: "upsc", name: "UPSC", icon: "🏛️", subtypes: ["CSE", "CDS", "NDA"] },
  { id: "neet", name: "NEET", icon: "🔬", subtypes: ["UG", "PG"] },
  { id: "jee", name: "JEE", icon: "⚗️", subtypes: ["Main", "Advanced"] },
  { id: "boards", name: "Boards", icon: "📚", subtypes: ["10th", "12th"] },
]

const YEARS = ["2024", "2025", "2026", "2027"]

export default function StudentOnboarding() {
  const router = useRouter()
  const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null)
  const [selectedSubtype, setSelectedSubtype] = React.useState<string>("")
  const [targetYear, setTargetYear] = React.useState<string>("2025")

  const selectedExam = EXAMS.find((e) => e.id === selectedExamId)

  const handleContinue = () => {
    if (selectedExamId) {
      router.push("/student/baseline")
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav showProfile={true} showNotification={true} title="Apna Rank" showBack onBack={() => router.back()} />
      
      <main className="max-w-[600px] mx-auto p-4 md:p-8 pt-8">
        <h1 className="text-[24px] md:text-[28px] font-bold text-[#0F172A] tracking-tight mb-8">
          Which exam are you preparing for?
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {EXAMS.map((exam) => {
            const isSelected = selectedExamId === exam.id
            return (
              <div
                key={exam.id}
                onClick={() => {
                  setSelectedExamId(exam.id)
                  setSelectedSubtype(exam.subtypes[0])
                }}
                className={`flex flex-col items-center justify-center p-6 rounded-[16px] border-[2px] cursor-pointer transition-all ${
                  isSelected
                    ? "border-[#4F46E5] bg-[#EEF2FF]"
                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                }`}
              >
                <div className="text-[32px] mb-3">{exam.icon}</div>
                <div className={`font-bold text-[16px] ${isSelected ? "text-[#312E81]" : "text-[#0F172A]"}`}>
                  {exam.name}
                </div>
              </div>
            )
          })}
        </div>

        {selectedExam && (
          <Card className="p-6 border-[#E2E8F0] rounded-[16px] space-y-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#334155]">
                Exam Sub-type
              </label>
              <select
                value={selectedSubtype}
                onChange={(e) => setSelectedSubtype(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white text-[16px] focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.25)]"
              >
                {selectedExam.subtypes.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[14px] font-medium text-[#334155]">
                Target Year
              </label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white text-[16px] focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.25)]"
              >
                {YEARS.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </Card>
        )}

        <Button
          onClick={handleContinue}
          className="w-full h-[56px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
          disabled={!selectedExamId}
        >
          Continue
        </Button>
      </main>
    </div>
  )
}
