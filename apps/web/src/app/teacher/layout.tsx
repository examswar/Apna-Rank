"use client"

import * as React from "react"
import { LeftSidebar } from "@/components/navigation/LeftSidebar"
import { Home, FileText, IndianRupee, Settings } from "lucide-react"

const TEACHER_NAV = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: Home },
  { label: "My Tests", href: "/teacher/tests", icon: FileText },
  { label: "Earnings", href: "/teacher/earnings", icon: IndianRupee },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeftSidebar items={TEACHER_NAV} basePath="/teacher/dashboard" />
      
      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-[240px] flex flex-col min-h-screen">
        <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
