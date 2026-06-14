"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, Users, FileText, Grid, Lightbulb, UserPlus, FilePlus, ExternalLink, MessageCircle } from "lucide-react"

const MOCK_STUDENTS = [
  { id: 1, name: "Rahul Verma", streak: 7, lastActive: "Today", weakTopic: "Geometry" },
  { id: 2, name: "Priya Singh", streak: 12, lastActive: "Yesterday", weakTopic: "Algebra" },
  { id: 3, name: "Amit Kumar", streak: 0, lastActive: "5 days ago", weakTopic: "Trigonometry" },
]

const MOCK_TESTS = [
  { id: 1, name: "Weekly Mock Test 4", date: "12 Jun 2026", completion: "95%" },
  { id: 2, name: "Algebra Sectional", date: "05 Jun 2026", completion: "88%" },
]

export default function BatchDetailPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("Students")

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <button onClick={() => router.push("/institute/batches")} className="p-2 -ml-2 rounded-full hover:bg-[#E2E8F0] transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#0F172A]" />
        </button>
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">SSC Target 2026</h1>
          <div className="flex items-center gap-3 text-[13px] font-medium text-[#64748B]">
            <span>SSC CGL</span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span>120 Students</span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span>Target: Oct 2026</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2E8F0] pb-[1px] overflow-x-auto scrollbar-hide">
        {["Students", "Tests", "Heatmap", "Lesson Plan"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-bold text-[14px] transition-all border-b-[3px] whitespace-nowrap ${
              activeTab === tab 
                ? "border-[#4F46E5] text-[#4F46E5]" 
                : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: Students */}
      {activeTab === "Students" && (
        <div className="space-y-4 animate-in slide-in-from-right-2 fade-in">
          <div className="flex justify-end">
            <Button className="h-[40px] px-4">
              <UserPlus className="w-4 h-4 mr-2" /> Add Students
            </Button>
          </div>
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="p-5 font-bold">Name</th>
                  <th className="p-5 font-bold">Streak</th>
                  <th className="p-5 font-bold">Last Active</th>
                  <th className="p-5 font-bold">Weak Topic</th>
                  <th className="p-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {MOCK_STUDENTS.map(student => (
                  <tr key={student.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-5 font-bold text-[#0F172A]">{student.name}</td>
                    <td className="p-5 font-mono text-[#F97316] font-bold">{student.streak} days</td>
                    <td className={`p-5 font-medium ${student.lastActive.includes("5") ? "text-[#DC2626]" : "text-[#64748B]"}`}>
                      {student.lastActive}
                    </td>
                    <td className="p-5 text-[#B91C1C] font-bold">{student.weakTopic}</td>
                    <td className="p-5 text-right">
                      <Button variant="secondary" className="h-[36px] px-3 bg-white border-[#E2E8F0] text-[#475569]">
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab Content: Tests */}
      {activeTab === "Tests" && (
        <div className="space-y-4 animate-in slide-in-from-right-2 fade-in">
          <div className="flex justify-end">
            <Button className="h-[40px] px-4">
              <FilePlus className="w-4 h-4 mr-2" /> Assign Test
            </Button>
          </div>
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="p-5 font-bold">Test Name</th>
                  <th className="p-5 font-bold">Assigned Date</th>
                  <th className="p-5 font-bold">Completion</th>
                  <th className="p-5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {MOCK_TESTS.map(test => (
                  <tr key={test.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-5 font-bold text-[#0F172A]">{test.name}</td>
                    <td className="p-5 font-medium text-[#64748B]">{test.date}</td>
                    <td className="p-5 font-mono font-bold text-[#10B981]">{test.completion}</td>
                    <td className="p-5 text-right">
                      <Button variant="secondary" className="h-[36px] px-3 bg-[#EEF2FF] text-[#4F46E5] border-transparent hover:bg-[#E0E7FF]">
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Tab Content: Heatmap (I-22) */}
      {activeTab === "Heatmap" && (
        <div className="space-y-6 animate-in slide-in-from-right-2 fade-in">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-[#0F172A] text-white font-bold rounded-[8px] text-[13px]">Maths</button>
              <button className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-[8px] text-[13px]">Reasoning</button>
            </div>
            <Button variant="ghost" className="text-[#4F46E5]">Download PDF</Button>
          </div>
          
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white p-6">
            {/* Heatmap Legend */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#E2E8F0] sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-[#FEE2E2]" />
                <span className="text-[13px] font-bold text-[#B91C1C]">Weak (&lt; 40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-[#FEF9C3]" />
                <span className="text-[13px] font-bold text-[#854D0E]">Moderate (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-[4px] bg-[#DCFCE7]" />
                <span className="text-[13px] font-bold text-[#166534]">Strong (&gt; 70%)</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-[180px_repeat(5,1fr)] gap-2">
              {/* Header Row */}
              <div className="font-bold text-[#64748B] text-[13px] p-2 flex items-center">Topic</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Mock 1</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Mock 2</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Sectional 1</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Mock 3</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Mock 4</div>

              {/* Rows */}
              {[
                { name: "Algebra", cells: ['w', 'w', 'm', 'm', 'w'] },
                { name: "Trigonometry", cells: ['m', 's', 's', 's', 's'] },
                { name: "Geometry", cells: ['w', 'm', 'w', 'w', 'w'] },
                { name: "Number System", cells: ['s', 's', 'm', 's', 's'] },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <div className="font-bold text-[#0F172A] text-[14px] p-2 flex items-center">{row.name}</div>
                  {row.cells.map((cell, j) => (
                    <div key={j} className={`h-[48px] rounded-[6px] border border-white flex items-center justify-center font-medium text-[11px] transition-transform hover:scale-[1.02] cursor-pointer ${
                      cell === 'w' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                      cell === 'm' ? 'bg-[#FEF9C3] text-[#854D0E]' :
                      'bg-[#DCFCE7] text-[#166534]'
                    }`}>
                      {cell === 'w' ? '32%' : cell === 'm' ? '55%' : '82%'}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Lesson Plan (I-23) */}
      {activeTab === "Lesson Plan" && (
        <div className="space-y-4 animate-in slide-in-from-right-2 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-[#0F172A] flex items-center gap-2">
                What to teach tomorrow? <Lightbulb className="w-5 h-5 text-[#D97706]" />
              </h2>
              <p className="text-[13px] text-[#64748B] mt-1">Auto-generated from recent batch performance</p>
            </div>
            <Button variant="secondary" className="bg-white">Refresh Data</Button>
          </div>

          <Card className="p-6 border-[#E2E8F0] shadow-sm bg-gradient-to-br from-[#FFFBEB] to-white">
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-[12px] border border-[#FDE68A] shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444]" />
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#B91C1C] rounded-[6px] text-[11px] font-black uppercase tracking-wider">Priority 1</span>
                  <h3 className="text-[18px] font-bold text-[#0F172A]">Geometry</h3>
                  <span className="text-[14px] font-bold text-[#EF4444]">— 78% students weak</span>
                </div>
                <div className="pl-4 space-y-2 text-[14px] text-[#475569] font-medium border-l-[2px] border-[#E2E8F0] ml-2">
                  <p>• Recommended time: 45 min</p>
                  <p>• Focus points: Circle theorems, Triangles similarity</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm relative overflow-hidden opacity-80">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F97316]" />
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 bg-[#FFEDD5] text-[#C2410C] rounded-[6px] text-[11px] font-black uppercase tracking-wider">Priority 2</span>
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Algebra</h3>
                  <span className="text-[14px] font-bold text-[#F97316]">— 54% weak</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-[#E2E8F0] pt-6">
              <Button className="h-[44px]">
                <MessageCircle className="w-4 h-4 mr-2" /> Share Plan on WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
