"use client"

import * as React from "react"
import { Card } from "@/components/ui/Card"
import { IndianRupee, History, Download, ChevronRight } from "lucide-react"

export default function TeacherEarningsPage() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">Earnings</h1>
        <p className="text-[#64748B] font-medium">Track your revenue and payout history.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-[#E2E8F0] shadow-sm bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-t-4 border-t-[#22C55E]">
          <h3 className="text-[14px] font-bold text-[#166534] uppercase tracking-wider mb-2">Available Balance</h3>
          <div className="text-[36px] font-black font-mono text-[#15803D] mb-4">₹8,500</div>
          <p className="text-[13px] font-medium text-[#166534]">Next automatic payout on 1st July</p>
        </Card>

        <Card className="p-6 border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-wider mb-2">This Month</h3>
          <div className="text-[32px] font-black font-mono text-[#0F172A]">₹3,200</div>
        </Card>

        <Card className="p-6 border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Lifetime Earnings</h3>
          <div className="text-[32px] font-black font-mono text-[#0F172A]">₹14,500</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <div className="space-y-4">
          <h3 className="text-[18px] font-bold text-[#0F172A]">Earnings by Test</h3>
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[13px] font-medium text-[#64748B]">
              Apna Rank charges a flat 40% platform fee. You keep 60% of all sales.
            </div>
            <div className="divide-y divide-[#E2E8F0]">
              {[
                { name: "SSC CGL Tier 1 Mock", price: 50, sales: 145, gross: 7250, net: 4350 },
                { name: "Algebra Masterclass", price: 60, sales: 89, gross: 5340, net: 3204 },
                { name: "NTPC Gen Science", price: 30, sales: 56, gross: 1680, net: 1008 },
              ].map((test, i) => (
                <div key={i} className="p-5 hover:bg-[#F8FAFC] transition-colors">
                  <h4 className="text-[15px] font-bold text-[#0F172A] mb-3">{test.name}</h4>
                  <div className="flex justify-between items-center text-[14px]">
                    <div>
                      <div className="text-[#64748B]">Sales</div>
                      <div className="font-bold text-[#0F172A]">{test.sales}</div>
                    </div>
                    <div>
                      <div className="text-[#64748B]">Gross (₹{test.price})</div>
                      <div className="font-mono text-[#0F172A]">₹{test.gross}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#64748B]">Your Share (60%)</div>
                      <div className="font-mono font-bold text-[#10B981]">₹{test.net}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Payout History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-bold text-[#0F172A]">Payout History</h3>
            <button className="text-[#4F46E5] text-[14px] font-bold flex items-center hover:underline">
              Download CSV <Download className="w-4 h-4 ml-1" />
            </button>
          </div>
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden bg-white">
            <div className="divide-y divide-[#E2E8F0]">
              {[
                { date: "01 Jun 2026", amount: "₹4,200", status: "Paid", ref: "UTR-89327498" },
                { date: "01 May 2026", amount: "₹1,800", status: "Paid", ref: "UTR-56291032" },
                { date: "01 Apr 2026", amount: "₹0", status: "No Sales", ref: "-" },
              ].map((payout, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0">
                      <History className="w-5 h-5 text-[#64748B]" />
                    </div>
                    <div>
                      <div className="font-bold text-[#0F172A]">{payout.date}</div>
                      <div className="text-[12px] font-mono text-[#94A3B8]">{payout.ref}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#0F172A]">{payout.amount}</div>
                    <div className={`text-[12px] font-bold uppercase tracking-wider ${
                      payout.status === "Paid" ? "text-[#10B981]" : "text-[#94A3B8]"
                    }`}>
                      {payout.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
