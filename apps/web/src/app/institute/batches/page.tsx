"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Search, PlusCircle, Filter, MoreVertical, Users, ChevronRight, FolderOpen } from "lucide-react"

const MOCK_BATCHES = [
  { id: 1, name: "SSC Target 2026", category: "SSC CGL", students: 120, target: "Oct 2026" },
  { id: 2, name: "UPSC Prelims Foundation", category: "UPSC", students: 85, target: "May 2026" },
  { id: 3, name: "Railway NTPC Fast Track", category: "Railway", students: 245, target: "Dec 2026" },
  { id: 4, name: "NEET Repeaters 2", category: "NEET-UG", students: 60, target: "May 2027" },
]

export default function InstituteBatchesPage() {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">Batches</h1>
          <p className="text-[#64748B] font-medium">Manage your classroom batches and assign tests.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="h-[48px] px-6 w-full sm:w-auto">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Batch
        </Button>
      </div>

      {MOCK_BATCHES.length === 0 ? (
        <Card className="border-[#E2E8F0] shadow-sm bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-[#EEF2FF] rounded-full flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <h3 className="text-[20px] font-bold text-[#0F172A] mb-2">No batches found</h3>
          <p className="text-[#64748B] font-medium max-w-md mb-8">
            Create your first batch to start onboarding students and assigning tests to them.
          </p>
          <Button onClick={() => setShowCreateModal(true)} className="h-[48px] px-8 text-[15px]">
            <PlusCircle className="w-5 h-5 mr-2" /> Create your first batch
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input 
                type="text" 
                placeholder="Search batches by name..."
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
                    <th className="p-5 font-bold">Batch Name</th>
                    <th className="p-5 font-bold">Exam Category</th>
                    <th className="p-5 font-bold">Students</th>
                    <th className="p-5 font-bold">Target Date</th>
                    <th className="p-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {MOCK_BATCHES.map((batch) => (
                    <tr key={batch.id} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => router.push("/institute/batch-detail")}>
                      <td className="p-5">
                        <div className="text-[15px] font-bold text-[#0F172A]">{batch.name}</div>
                      </td>
                      <td className="p-5">
                        <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#F1F5F9] text-[#475569]">
                          {batch.category}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center font-medium text-[#0F172A]">
                          <Users className="w-4 h-4 mr-2 text-[#94A3B8]" />
                          {batch.students}
                        </div>
                      </td>
                      <td className="p-5 font-medium text-[#64748B]">{batch.target}</td>
                      <td className="p-5 text-right space-x-2">
                        <Button variant="ghost" className="h-[36px] w-[36px] p-0 text-[#64748B] hover:text-[#0F172A]" onClick={(e) => e.stopPropagation()}>
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
              {MOCK_BATCHES.map((batch) => (
                <div key={batch.id} className="p-4 flex flex-col gap-3" onClick={() => router.push("/institute/batch-detail")}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-[16px] font-bold text-[#0F172A]">{batch.name}</div>
                    <Button variant="ghost" className="h-[32px] w-[32px] p-0 -mt-1 -mr-2 text-[#64748B]" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#475569]">
                      {batch.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#4F46E5] flex items-center">
                      <Users className="w-3 h-3 mr-1" /> {batch.students}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-[#64748B]">Target: <span className="font-medium text-[#0F172A]">{batch.target}</span></span>
                    <Button variant="ghost" className="h-[32px] px-2 text-[#4F46E5]">
                      Manage <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Create Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[480px] bg-white p-6 rounded-[20px] shadow-xl animate-in zoom-in-95">
            <h2 className="text-[20px] font-bold text-[#0F172A] mb-6">Create New Batch</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Batch Name *</label>
                <input type="text" placeholder="e.g., Morning Batch SSC 2026" className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] focus:outline-none focus:border-[#4F46E5]" />
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Exam Category *</label>
                <select className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] focus:outline-none focus:border-[#4F46E5] bg-white">
                  <option>SSC CGL</option>
                  <option>Railway NTPC</option>
                  <option>UPSC</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Target Exam Date</label>
                <input type="date" className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] focus:outline-none focus:border-[#4F46E5]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1 border-[#E2E8F0] text-[#475569]">
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)} className="flex-1">
                Create Batch
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
