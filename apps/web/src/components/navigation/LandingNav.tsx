"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Rocket } from "lucide-react"
export function LandingNav() {
  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Features", href: "#features" },
    { name: "Exams", href: "#exams" },
  ]

  return (
    <nav className="w-full bg-white border-b border-[#E2E8F0]">
      <div className="w-full px-4 md:px-8 flex items-center justify-between h-[80px]">
        {/* Logo */}
        <Link href="/" className="group flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-6 h-6 text-[#4F46E5]" />
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#4F46E5] transition-colors">
              Apna Rank
            </h1>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium tracking-wide mt-0.5 ml-7">
            Rank Badhao, Roz
          </span>
        </Link>
        
        {/* Center Menu (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="text-[15px] font-medium text-[#475569] hover:text-[#4F46E5] transition-colors">
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link href="/auth/phone" className="hidden sm:block">
            <Button className="bg-[#4F46E5] text-white hover:bg-[#4338CA] rounded-full px-[36px] py-[12px] h-auto text-[15px] font-semibold transition-colors">
              Login
            </Button>
          </Link>
          <Link href="/auth/phone">
            <Button variant="secondary" className="bg-white border-[1.5px] border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50 hover:text-[#4F46E5] rounded-full px-[36px] py-[12px] h-auto text-[15px] font-semibold transition-colors">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
