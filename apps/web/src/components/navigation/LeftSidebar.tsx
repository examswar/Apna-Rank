"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface LeftSidebarProps {
  items: NavItem[]
  basePath: string
}

export function LeftSidebar({ items, basePath }: LeftSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0 bg-white border-r border-[#E2E8F0] z-40">
      <div className="h-[64px] flex items-center px-6 border-b border-[#E2E8F0]">
        <Link href={basePath}>
          <h1 className="text-[24px] font-black text-[#4F46E5] tracking-tight">
            Apna Rank
          </h1>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== basePath)
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 rounded-[10px] font-medium text-[15px] transition-colors",
                  isActive
                    ? "bg-[#EEF2FF] text-[#4F46E5] border-l-[3px] border-[#4F46E5] rounded-l-[7px]"
                    : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] border-l-[3px] border-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-[#4F46E5]" : "text-[#64748B]")} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wide mb-2 px-2">
          {basePath.includes('teacher') ? 'Teacher Portal' : 'Institute Portal'}
        </div>
      </div>
    </aside>
  )
}
