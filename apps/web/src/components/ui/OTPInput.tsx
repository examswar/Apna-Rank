"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface OTPInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({ value = "", onChange, error, disabled, className }: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  // Fully controlled: the digits are derived from the value prop, the parent
  // owns the state via onChange.
  const otp = React.useMemo(
    () => value.split("").concat(Array(6).fill("")).slice(0, 6),
    [value]
  )

  const triggerChange = (newOtp: string[]) => {
    if (onChange) {
      onChange(newOtp.join(""))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    if (/[^0-9]/.test(val)) return // only digits

    // Allow single digit
    if (val.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = val
      triggerChange(newOtp)

      // Auto-advance
      if (val !== "" && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6)
    
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        if (i < 6) newOtp[i] = pastedData[i]
      }
      triggerChange(newOtp)
      
      // Focus last filled input or next empty one
      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  return (
    <div className={cn("flex items-center gap-[8px]", className)}>
      {otp.map((digit, index) => {
        const isFilled = digit !== ""
        
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className={cn(
              "w-[48px] h-[56px] text-center text-[24px] font-mono font-bold rounded-[10px] border-2 transition-all outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error 
                ? "border-[#EF4444] bg-[#FEF2F2]" 
                : isFilled 
                  ? "border-[#4F46E5] bg-[#EEF2FF]" 
                  : "border-[#E2E8F0] bg-white",
              "focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.25)] focus:bg-white"
            )}
          />
        )
      })}
    </div>
  )
}
