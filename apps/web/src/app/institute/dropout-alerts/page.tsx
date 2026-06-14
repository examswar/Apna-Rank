"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { AlertTriangle, Search, Filter, MessageSquare, ExternalLink } from "lucide-react"

const MOCK_DROPOUTS = [
  { id: 1, name: "Amit Kumar", batch: "SSC Target 2026", inactiveDays: 7, streakBefore: 14 },
  { id: 2, name: "Suresh Gupta", batch: "UPSC Prelims Foundation", inactiveDays: 12, streakBefore: 2 },
  { id: 3, name: "Neha Sharma", batch: "SSC Target 2026", inactiveDays: 5, streakBefore: 30 },
  { id: 4, name: "Vikram Singh", batch: "Railway NTPC Fast Track", inactiveDays: 8, streakBefore: 5 },
  { id: 5, name: "Riya Patel", batch: "NEET Repeaters 2", inactiveDays: 15, streakBefore: 0 },
]

export default function DropoutAlertsPage() {
  const router = useRouter()
  const [filter, setFilter] = React.useState("5+")

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#D97706]" />
            Dropout Risk Students
          </h1>
          <p className="text-[#64748B] font-medium">Students who haven't been active for 5+ days.</p>
        </div>
        <Button className="h-[48px] px-6 w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C]">
          <MessageSquare className="w-5 h-5 mr-2" />
          SMS All At-Risk
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search students..."
            className="w-full h-[48px] pl-12 pr-4 rounded-[12px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] bg-white"
          />
        </div>
        <div className="flex gap-2">
          {["5+ days", "7+ days", "10+ days"].map(f => (
            <Button
              key={f}
              variant="secondary"
              className={`h-[48px] px-5 bg-white transition-all ${
                filter === f.split(' ')[0]
                  ? "border-[#D97706] text-[#B45309] bg-[#FFFBEB]"
                  : "border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"
              }`}
              onClick={() => setFilter(f.split(' ')[0])}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="p-5 font-bold">Student Name</th>
                <th className="p-5 font-bold">Batch</th>
                <th className="p-5 font-bold">Inactive Since</th>
                <th className="p-5 font-bold">Streak Before</th>
                <th className="p-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {MOCK_DROPOUTS.map((student) => (
                <tr key={student.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-5 font-bold text-[#0F172A]">{student.name}</td>
                  <td className="p-5 text-[#475569] font-medium">{student.batch}</td>
                  <td className="p-5">
                    <span className="text-[#DC2626] font-bold">{student.inactiveDays} days</span>
                  </td>
                  <td className="p-5 font-mono text-[#64748B] font-medium">{student.streakBefore} days</td>
                  <td className="p-5 text-right space-x-2">
                    <Button variant="secondary" className="h-[36px] px-3 bg-white border-[#E2E8F0] text-[#475569] hover:text-[#0F172A]">
                      <ExternalLink className="w-4 h-4 mr-2" /> Profile
                    </Button>
                    <Button variant="ghost" className="h-[36px] px-3 text-[#F97316] bg-[#FFF7ED] hover:bg-[#FFEDD5]">
                      <MessageSquare className="w-4 h-4 mr-2" /> SMS
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
