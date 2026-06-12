import * as React from "react"
import { ChevronLeft, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/Button"

export interface TopNavProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  showNotification?: boolean;
  onNotificationClick?: () => void;
  showProfile?: boolean;
  onProfileClick?: () => void;
  className?: string;
}

export function TopNav({
  showBack,
  onBack,
  title,
  showNotification,
  onNotificationClick,
  showProfile,
  onProfileClick,
  className
}: TopNavProps) {
  return (
    <header className={cn("sticky top-0 z-50 flex h-[64px] w-full items-center justify-between bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 md:px-8", className)}>
      <div className="flex items-center">
        {showBack ? (
          <button onClick={onBack} className="p-2 -ml-2 mr-2 rounded-full hover:bg-neutral-100 transition-colors">
            <ChevronLeft className="w-6 h-6 text-[#0F172A]" />
          </button>
        ) : null}
        <Link href="/">
          <h1 className="text-[24px] font-black text-[#4F46E5] tracking-tight">
            {title || "Apna Rank"}
          </h1>
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {showNotification && (
          <button onClick={onNotificationClick} className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <Bell className="w-6 h-6 text-[#475569]" />
          </button>
        )}
        {showProfile && (
          <button onClick={onProfileClick} className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <User className="w-6 h-6 text-[#475569]" />
          </button>
        )}
        {!showProfile && (
          <Link href="/auth/phone">
            <Button variant="secondary" className="h-10 px-6 text-sm font-bold border-2">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
