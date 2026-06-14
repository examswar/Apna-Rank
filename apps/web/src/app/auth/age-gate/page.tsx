"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input, Label } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"

export default function AgeGatePage() {
  const router = useRouter()
  const [dob, setDob] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dob) {
      router.push("/student/onboarding") // Flow complete, redirecting to home/dashboard
    }
  }

  return (
    <Card className="p-8 border-none shadow-xl rounded-[24px]">
      <div className="text-center mb-8">
        <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight mb-2">
          Apni date of birth daalo
        </h2>
        <p className="text-[15px] text-[#64748B] font-medium">
          Yeh sirf safety ke liye hai
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            className="w-full h-[52px] text-[16px] font-medium"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
          disabled={!dob}
        >
          Continue
        </Button>
      </form>
    </Card>
  )
}
