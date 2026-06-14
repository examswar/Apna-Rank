"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input, Label } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"

export default function PhonePage() {
  const router = useRouter()
  const [phone, setPhone] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length === 10) {
      router.push("/auth/otp")
    }
  }

  return (
    <Card className="p-8 border-none shadow-xl rounded-[24px]">
      <div className="text-center mb-8">
        <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight">
          Welcome! Apna number daalo
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-[#64748B] font-medium text-[16px]">
              +91
            </span>
            <div className="absolute left-12 top-[12px] bottom-[12px] w-[1px] bg-[#E2E8F0]"></div>
            <Input
              id="phone"
              type="tel"
              maxLength={10}
              placeholder="98765 43210"
              className="pl-16 text-[16px] font-medium tracking-wide h-[52px]"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
          disabled={phone.length !== 10}
        >
          Send OTP
        </Button>

        <p className="text-center text-[13px] text-[#64748B] font-medium">
          OTP SMS se aayega
        </p>
      </form>
    </Card>
  )
}
