"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, Download } from "lucide-react"

export default function InstituteHeatmapPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-[#E2E8F0] transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#0F172A]" />
          </button>
          <div>
            <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">SSC Target 2026 — Topic Heatmap</h1>
            <p className="text-[#64748B] font-medium text-[14px]">Aggregate topic weaknesses across the entire batch.</p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white border-[#E2E8F0] text-[#475569]">
          <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <div className="flex gap-2 border-b border-[#E2E8F0] pb-[1px]">
        {["Maths", "Reasoning", "GK/GS", "English"].map((tab, idx) => (
          <button
            key={tab}
            className={`px-6 py-3 font-bold text-[14px] transition-all border-b-[3px] ${
              idx === 0 
                ? "border-[#4F46E5] text-[#4F46E5]" 
                : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white p-6">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
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

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-2 mb-2">
              <div className="font-bold text-[#64748B] text-[13px] p-2 flex items-center sticky left-0 bg-white z-20">Topic</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Test 1</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Test 2</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Test 3</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Test 4</div>
              <div className="font-bold text-[#0F172A] text-[13px] p-2 text-center bg-[#F8FAFC] rounded-[6px]">Test 5</div>
            </div>

            {[
              { name: "Algebra", cells: ['w', 'w', 'm', 'm', 'w'] },
              { name: "Trigonometry", cells: ['m', 's', 's', 's', 's'] },
              { name: "Geometry", cells: ['w', 'm', 'w', 'w', 'w'] },
              { name: "Number System", cells: ['s', 's', 'm', 's', 's'] },
              { name: "Profit & Loss", cells: ['m', 'm', 'm', 's', 's'] },
              { name: "Time & Distance", cells: ['w', 'w', 'w', 'm', 'm'] },
              { name: "Percentages", cells: ['s', 's', 's', 's', 's'] },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-[200px_repeat(5,1fr)] gap-2 mb-2">
                <div className="font-bold text-[#0F172A] text-[14px] p-2 flex items-center sticky left-0 bg-white z-20 border-r border-transparent hover:border-[#E2E8F0]">{row.name}</div>
                {row.cells.map((cell, j) => (
                  <div key={j} className={`h-[48px] rounded-[6px] border border-white flex items-center justify-center font-medium text-[12px] transition-transform hover:scale-[1.02] cursor-pointer shadow-sm ${
                    cell === 'w' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
                    cell === 'm' ? 'bg-[#FEF9C3] text-[#854D0E]' :
                    'bg-[#DCFCE7] text-[#166534]'
                  }`}>
                    {cell === 'w' ? '32%' : cell === 'm' ? '55%' : '82%'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
