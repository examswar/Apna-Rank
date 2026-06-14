"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { GraduationCap, BookOpen, Building } from "lucide-react"

type Role = "student" | "teacher" | "institute" | null

export default function RolePage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = React.useState<Role>(null)

  const handleContinue = () => {
    if (selectedRole) {
      router.push("/auth/age-gate")
    }
  }

  const roles = [
    {
      id: "student",
      title: "Student",
      desc: "Test do, diagnosis dekho",
      icon: GraduationCap,
    },
    {
      id: "teacher",
      title: "Teacher",
      desc: "Tests banao, padhao",
      icon: BookOpen,
    },
    {
      id: "institute",
      title: "Institute",
      desc: "Apne students manage karo",
      icon: Building,
    },
  ]

  return (
    <Card className="p-8 border-none shadow-xl rounded-[24px]">
      <div className="text-center mb-8">
        <h2 className="text-[24px] font-bold text-[#0F172A] tracking-tight">
          Aap kaun ho?
        </h2>
      </div>

      <div className="space-y-4 mb-8">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id
          const Icon = role.icon
          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id as Role)}
              className={`p-4 rounded-[16px] border-[2px] cursor-pointer transition-all flex items-center gap-4 ${
                isSelected
                  ? "border-[#4F46E5] bg-[#EEF2FF]"
                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-[#4F46E5] text-white" : "bg-[#F1F5F9] text-[#64748B]"
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-[16px] font-bold ${isSelected ? "text-[#312E81]" : "text-[#0F172A]"}`}>
                  {role.title}
                </h3>
                <p className="text-[14px] text-[#64748B] font-medium mt-0.5">
                  {role.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-[16px] font-bold rounded-[12px]"
        disabled={!selectedRole}
      >
        Continue
      </Button>
    </Card>
  )
}
