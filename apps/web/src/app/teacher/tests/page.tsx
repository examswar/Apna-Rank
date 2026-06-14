"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PlusCircle, Search, Filter, MoreVertical, BarChart2, FileQuestion } from "lucide-react"

const MOCK_TESTS = [
  { id: 1, name: "SSC CGL Tier 1 Mock (2026 Pattern)", category: "SSC", status: "Published", price: "₹30", buyers: 145, earnings: "₹4,350", date: "10 Jun 2026" },
  { id: 2, name: "Complete Algebra Masterclass Test", category: "SSC", status: "Published", price: "₹40", buyers: 89, earnings: "₹3,560", date: "05 Jun 2026" },
  { id: 3, name: "Railway NTPC General Science", category: "Railway", status: "Published", price: "₹20", buyers: 56, earnings: "₹1,120", date: "01 Jun 2026" },
  { id: 4, name: "UPSC Prelims Economy Basics", category: "UPSC", status: "Draft", price: "-", buyers: 0, earnings: "-", date: "Last edited today" },
]

export default function TeacherTestsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">My Tests</h1>
          <p className="text-[#64748B] font-medium">Manage your published tests and drafts.</p>
        </div>
        <Button onClick={() => router.push("/teacher/create-test")} className="h-[48px] px-6 w-full sm:w-auto">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Test
        </Button>
      </div>

      {MOCK_TESTS.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[#EEF2FF] rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <h3 className="text-[20px] font-bold text-[#0F172A] mb-2">No tests created yet</h3>
          <p className="text-[#64748B] font-medium max-w-md mb-8">
            Start building your audience and generating revenue by creating your first mock test.
          </p>
          <Button onClick={() => router.push("/teacher/create-test")} className="h-[48px] px-8 text-[15px]">
            <PlusCircle className="w-5 h-5 mr-2" /> Create your first test
          </Button>
        </Card>
      ) : (
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Search your tests..."
                className="w-full h-[48px] pl-12 pr-4 rounded-[12px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4F46E5] bg-white"
              />
            </div>
            <Button variant="secondary" className="h-[48px] px-6 bg-white border-[#E2E8F0] text-[#475569]">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </Button>
          </div>

          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="p-5 font-bold">Test Name</th>
                    <th className="p-5 font-bold">Status</th>
                    <th className="p-5 font-bold">Price</th>
                    <th className="p-5 font-bold">Buyers</th>
                    <th className="p-5 font-bold">Earnings</th>
                    <th className="p-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {MOCK_TESTS.map((test) => (
                    <tr key={test.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-5">
                        <div className="text-[15px] font-bold text-[#0F172A] mb-1">{test.name}</div>
                        <div className="text-[13px] font-medium text-[#64748B]">{test.category} • {test.date}</div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          test.status === "Published" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#475569]"
                        }`}>
                          {test.status}
                        </span>
                      </td>
                      <td className="p-5 font-mono text-[14px]">{test.price}</td>
                      <td className="p-5 font-medium">{test.buyers}</td>
                      <td className="p-5 font-bold text-[#10B981]">{test.earnings}</td>
                      <td className="p-5 text-right space-x-2">
                        {test.status === "Published" && (
                          <Button variant="ghost" className="h-[36px] px-3 text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF]">
                            <BarChart2 className="w-4 h-4 mr-2" /> Analytics
                          </Button>
                        )}
                        <Button variant="ghost" className="h-[36px] w-[36px] p-0 text-[#64748B] hover:text-[#0F172A]">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards View */}
            <div className="md:hidden divide-y divide-[#E2E8F0]">
              {MOCK_TESTS.map((test) => (
                <div key={test.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-[15px] font-bold text-[#0F172A] mb-1">{test.name}</div>
                      <div className="text-[13px] font-medium text-[#64748B]">{test.category} • {test.date}</div>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      test.status === "Published" ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F1F5F9] text-[#475569]"
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 py-2 bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0] px-3">
                    <div>
                      <div className="text-[11px] font-bold text-[#64748B] uppercase">Price</div>
                      <div className="font-mono text-[13px] font-medium">{test.price}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#64748B] uppercase">Buyers</div>
                      <div className="text-[13px] font-medium">{test.buyers}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-[#64748B] uppercase">Earned</div>
                      <div className="text-[13px] font-bold text-[#10B981]">{test.earnings}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-1">
                    {test.status === "Published" && (
                      <Button variant="ghost" className="h-[36px] flex-1 text-[#4F46E5] bg-[#EEF2FF] hover:bg-[#E0E7FF]">
                        <BarChart2 className="w-4 h-4 mr-2" /> Analytics
                      </Button>
                    )}
                    <Button variant="ghost" className="h-[36px] px-3 border border-[#E2E8F0] text-[#64748B]">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
