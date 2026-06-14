"use client"

import * as React from "react"
import { TopNav } from "@/components/navigation/TopNav"
import { BottomTabBar } from "@/components/navigation/BottomTabBar"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Flame, TrendingUp, CheckCircle, Target, FileText, Swords, BookOpen, PlayCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const PERFORMANCE_DATA = [
  { day: "Mon", score: 45 },
  { day: "Tue", score: 60 },
  { day: "Wed", score: 55 },
  { day: "Thu", score: 80 },
  { day: "Fri", score: 40 },
  { day: "Sat", score: 90 },
  { day: "Sun", score: 85 },
]

const TOPIC_READINESS = [
  { topic: "Algebra", progress: 85, color: "bg-green-500" },
  { topic: "Trigonometry", progress: 45, color: "bg-red-500" },
  { topic: "Geometry", progress: 65, color: "bg-yellow-500" },
]

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[80px]">
      <TopNav 
        title="Apna Rank" 
        showNotification 
        onNotificationClick={() => {}} 
        showProfile 
        onProfileClick={() => {}} 
      />

      <main className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6 pt-6">
        
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-br from-[#4F46E5] to-[#312E81] text-white p-6 border-none shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-bold tracking-tight">Welcome back, Rahul!</h2>
              <p className="text-white/80 font-medium mt-1">Ready to boost your rank today?</p>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md w-fit border border-white/10">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="font-bold text-[15px]">7 Day Streak</span>
            </div>
          </div>
        </Card>

        {/* 4 Stat Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Streak</span>
            </div>
            <div className="text-[24px] font-black text-[#0F172A]">7 Days</div>
          </Card>
          <Card className="p-4 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <Target className="w-4 h-4 text-[#4F46E5]" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Readiness</span>
            </div>
            <div className="text-[24px] font-black text-[#0F172A]">65%</div>
          </Card>
          <Card className="p-4 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Tests Done</span>
            </div>
            <div className="text-[24px] font-black text-[#0F172A]">12</div>
          </Card>
          <Card className="p-4 border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 text-[#64748B] mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Rank</span>
            </div>
            <div className="text-[24px] font-black text-[#0F172A]">Top 30%</div>
          </Card>
        </div>

        {/* Today's One Task Card */}
        <Card className="bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border-[1.5px] border-[#FB923C] border-l-[6px] border-l-[#F97316] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#F97316] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Today's Task
                </span>
              </div>
              <h3 className="text-[20px] font-bold text-[#431407] mb-2 leading-tight">
                Practice 15 Algebra questions
              </h3>
              <p className="text-[15px] font-medium text-[#78350F]">
                Focus on calculation accuracy and speed.
              </p>
            </div>
            <Button className="w-full md:w-auto h-[48px] px-8 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-full shadow-md whitespace-nowrap group">
              <PlayCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Now
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Chart Card */}
          <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col h-[320px]">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-6">Last 7 Days Performance</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={PERFORMANCE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {PERFORMANCE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 50 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Topic Readiness Card */}
          <Card className="p-5 border-[#E2E8F0] shadow-sm flex flex-col h-[320px]">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-6">Topic Readiness</h3>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {TOPIC_READINESS.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-[14px] font-semibold text-[#334155]">
                    <span>{item.topic}</span>
                    <span className={item.progress >= 80 ? 'text-green-600' : item.progress >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`} 
                      style={{ width: `${item.progress}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6">
          <Button variant="secondary" className="h-[60px] bg-white hover:bg-[#EEF2FF] border-[1.5px] border-[#E2E8F0] hover:border-[#4F46E5] text-[#0F172A] hover:text-[#4F46E5] flex justify-start px-5 font-bold shadow-sm transition-all group">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] group-hover:bg-[#4F46E5] text-[#4F46E5] group-hover:text-white flex items-center justify-center mr-3 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            Take Test
          </Button>
          <Button variant="secondary" className="h-[60px] bg-white hover:bg-[#EEF2FF] border-[1.5px] border-[#E2E8F0] hover:border-[#4F46E5] text-[#0F172A] hover:text-[#4F46E5] flex justify-start px-5 font-bold shadow-sm transition-all group">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] group-hover:bg-[#4F46E5] text-[#4F46E5] group-hover:text-white flex items-center justify-center mr-3 transition-colors">
              <Swords className="w-4 h-4" />
            </div>
            Battle
          </Button>
          <Button variant="secondary" className="h-[60px] bg-white hover:bg-[#EEF2FF] border-[1.5px] border-[#E2E8F0] hover:border-[#4F46E5] text-[#0F172A] hover:text-[#4F46E5] flex justify-start px-5 font-bold shadow-sm transition-all group">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] group-hover:bg-[#4F46E5] text-[#4F46E5] group-hover:text-white flex items-center justify-center mr-3 transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
            Mistakes
          </Button>
        </div>
      </main>

      <BottomTabBar />
    </div>
  )
}
