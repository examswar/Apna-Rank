"use client"

import * as React from "react"
import { LeftSidebar } from "@/components/navigation/LeftSidebar"
import { Home, Users, AlertTriangle, BookOpen, Settings } from "lucide-react"

const INSTITUTE_NAV = [
  { label: "Dashboard", href: "/institute/dashboard", icon: Home },
  { label: "Batches", href: "/institute/batches", icon: Users },
  { label: "Dropout Alerts", href: "/institute/dropout-alerts", icon: AlertTriangle },
  { label: "Settings", href: "/institute/settings", icon: Settings },
]

export default function InstituteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <LeftSidebar items={INSTITUTE_NAV} basePath="/institute/dashboard" />
      
      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-[240px] flex flex-col min-h-screen">
        <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
