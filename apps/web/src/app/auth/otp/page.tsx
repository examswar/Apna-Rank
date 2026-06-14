"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { OTPInput } from "@/components/ui/OTPInput"
import { Card } from "@/components/ui/Card"
import { ArrowLeft } from "lucide-react"

export default function OTPPage() {
  const router = useRouter()
  const [otp, setOtp] = React.useState("")
  const [countdown, setCountdown] = React.useState(30)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 6) {
      router.push("/auth/role")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="p-8 border-none shadow-xl rounded-[24px]">
      <div className="mb-6">
        <Link href="/auth/phone" className="inline-flex items-center text-[#64748B] hover:text-[#0F172A] transition-colors text-[14px] font-medium mb-4">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Change number
        </Link>
        <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight mb-2">
          OTP daalo
        </h2>
        <p className="text-[15px] text-[#64748B] font-medium">
          +91 98XXXXXX02 par bheja hai
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex justify-center">
          <OTPInput
            value={otp}
            onChange={setOtp}
          />
        </div>

        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-[14px] font-medium text-[#64748B]">
              Resend OTP in <span className="text-[#0F172A] font-bold">{formatTime(countdown)}</span>
            </p>
          ) : (
            <button
              type="button"
              className="text-[14px] font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
              onClick={() => setCountdown(30)}
            >
              Resend OTP
            </button>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
          disabled={otp.length !== 6}
        >
          Verify
        </Button>
      </form>
    </Card>
  )
}
