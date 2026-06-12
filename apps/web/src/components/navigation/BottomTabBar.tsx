"use client"

import * as React from "react"
import { Home, FileText, Swords, BookOpen, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export interface BottomTabBarProps {
  className?: string;
}

const TABS = [
  { id: "home", label: "Ghar", icon: Home, href: "/student/home" },
  { id: "test", label: "Test", icon: FileText, href: "/student/tests" },
  { id: "battle", label: "Battle", icon: Swords, href: "/student/battle" },
  { id: "notebook", label: "Notebook", icon: BookOpen, href: "/student/notebook" },
  { id: "profile", label: "Profile", icon: User, href: "/student/profile" },
]

export function BottomTabBar({ className }: BottomTabBarProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("fixed bottom-0 left-0 w-full bg-white border-t border-[#E2E8F0] z-50 pb-[env(safe-area-inset-bottom)]", className)}>
      <div className="flex items-center h-[64px] justify-between px-2">
        {TABS.map((tab) => {
          const isActive = pathname?.startsWith(tab.href) || false
          const Icon = tab.icon

          return (
            <Link 
              key={tab.id} 
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-1/5 h-full gap-1"
            >
              {isActive && (
                <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
              )}
              <Icon 
                className={cn(
                  "w-[24px] h-[24px]", 
                  isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"
                )} 
              />
              <span 
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-[#4F46E5]" : "text-[#94A3B8]"
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
