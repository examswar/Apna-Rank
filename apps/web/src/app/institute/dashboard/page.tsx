"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Users, AlertTriangle, BookOpen, ChevronRight, TrendingUp, UserMinus } from "lucide-react"

export default function InstituteDashboardPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">Sharma Academy</h1>
          <p className="text-[#64748B] font-medium">Batch performance overview.</p>
        </div>
      </div>

      {/* Dropout Risk Alert */}
      <Card className="bg-gradient-to-r from-[#FEF2F2] to-white border border-[#FECACA] p-4 flex items-center justify-between rounded-[12px] shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/institute/dropout-alerts")}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#991B1B]">12 Students at High Risk</p>
            <p className="text-[13px] font-medium text-[#B91C1C]">Inactive for 5+ days across all batches.</p>
          </div>
        </div>
        <Button variant="ghost" className="text-[#DC2626] hover:bg-[#FEE2E2] shrink-0">
          Review List <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <Users className="w-5 h-5 text-[#4F46E5]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Total Enrolled</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">450</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <BookOpen className="w-5 h-5 text-[#10B981]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Active Batches</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">6</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <TrendingUp className="w-5 h-5 text-[#F97316]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Avg Score Trend</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#10B981]">+12%</div>
        </Card>
        <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[#64748B] mb-3">
            <UserMinus className="w-5 h-5 text-[#EF4444]" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Absenteeism</span>
          </div>
          <div className="text-[28px] font-black font-mono text-[#0F172A]">4%</div>
        </Card>
      </div>

      {/* Batches Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Active Batches</h3>
          <Button variant="ghost" onClick={() => router.push("/institute/batches")}>View All Batches</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[
            { id: 1, name: "SSC Target 2026", students: 120, weak: "Geometry", tests: 4 },
            { id: 2, name: "UPSC Prelims Foundation", students: 85, weak: "Modern History", tests: 2 },
            { id: 3, name: "Railway NTPC Fast Track", students: 245, weak: "General Science", tests: 6 },
          ].map((batch) => (
            <Card key={batch.id} className="p-6 border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer" onClick={() => router.push("/institute/batch-detail")}>
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-[18px] font-bold text-[#0F172A]">{batch.name}</h4>
                <div className="px-2.5 py-1 bg-[#F1F5F9] rounded-full text-[12px] font-bold text-[#475569]">
                  {batch.students} Students
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[#64748B] font-medium">Tests Assigned</span>
                  <span className="font-bold text-[#0F172A]">{batch.tests}</span>
                </div>
                <div className="flex justify-between items-center text-[14px] p-2 bg-[#FEF2F2] rounded-[8px] border border-[#FEE2E2]">
                  <span className="text-[#991B1B] font-medium">Top Weak Topic</span>
                  <span className="font-bold text-[#B91C1C]">{batch.weak}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 h-[40px] text-[13px] bg-[#EEF2FF] text-[#4F46E5] border-transparent hover:bg-[#E0E7FF]" onClick={(e) => { e.stopPropagation(); router.push("/institute/heatmap") }}>
                  View Heatmap
                </Button>
                <Button variant="secondary" className="w-[40px] h-[40px] p-0 border-[#E2E8F0] text-[#64748B]">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
