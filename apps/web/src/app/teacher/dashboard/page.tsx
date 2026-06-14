"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { FileText, IndianRupee, Users, Star, PlusCircle, BarChart2, BadgeCheck } from "lucide-react"

export default function TeacherDashboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight">Namaste, Amit!</h1>
            <BadgeCheck className="w-6 h-6 text-[#4F46E5] fill-[#EEF2FF]" />
          </div>
          <p className="text-[#64748B] font-medium">Here is how your tests are performing today.</p>
        </div>
        <Button onClick={() => router.push("/teacher/create-test")} className="h-[48px] px-6">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Test
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <FileText className="w-5 h-5 text-[#4F46E5]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Tests Published</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">12</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <IndianRupee className="w-5 h-5 text-[#10B981]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Total Earnings</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">₹14,500</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <Users className="w-5 h-5 text-[#F97316]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Total Buyers</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">290</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <Star className="w-5 h-5 text-[#EAB308]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Avg Rating</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">4.8<span className="text-[16px] text-[#94A3B8]">/5</span></div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Tests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold text-[#0F172A]">Recent Tests</h3>
            <Button variant="ghost" onClick={() => router.push("/teacher/tests")}>View All</Button>
          </div>
          
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="divide-y divide-[#E2E8F0]">
              {[
                { name: "SSC CGL Tier 1 Mock (2026 Pattern)", buyers: 145, avgScore: "115/200", earnings: "₹4,350" },
                { name: "Complete Algebra Masterclass Test", buyers: 89, avgScore: "68/100", earnings: "₹3,560" },
                { name: "Railway NTPC General Science", buyers: 56, avgScore: "35/50", earnings: "₹1,120" },
              ].map((test, i) => (
                <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-[#F8FAFC] transition-colors">
                  <div>
                    <h4 className="text-[16px] font-bold text-[#0F172A] mb-1">{test.name}</h4>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[#64748B]">
                      <span>{test.buyers} Purchases</span>
                      <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                      <span>Avg Score: {test.avgScore}</span>
                      <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                      <span className="text-[#10B981]">{test.earnings}</span>
                    </div>
                  </div>
                  <Button variant="secondary" className="shrink-0 h-[40px] px-4 text-[13px]">
                    <BarChart2 className="w-4 h-4 mr-2" /> Analytics
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Earnings Snippet */}
        <div className="space-y-6">
          <Card className="p-6 border-[#E2E8F0] shadow-sm bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-t-4 border-t-[#22C55E]">
            <h3 className="text-[16px] font-bold text-[#166534] mb-2">Next Payout</h3>
            <div className="text-[32px] font-black font-mono text-[#15803D] mb-4">₹8,500</div>
            <p className="text-[13px] font-medium text-[#166534] mb-4">Scheduled for 1st July 2026</p>
            <Button onClick={() => router.push("/teacher/earnings")} className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold h-[48px]">
              View Earnings Details
            </Button>
          </Card>

          <Card className="p-6 border-[#E2E8F0] shadow-sm">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-4">Teacher Resources</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 rounded-[10px] hover:bg-[#F1F5F9] transition-colors text-left border border-transparent hover:border-[#E2E8F0]">
                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center mr-3 shrink-0">
                  <FileText className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#0F172A]">Test Creation Guide</div>
                  <div className="text-[12px] text-[#64748B]">How to write better questions</div>
                </div>
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
