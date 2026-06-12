"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input, Label, ErrorMessage } from "@/components/ui/Input"
import { OTPInput } from "@/components/ui/OTPInput"
import { useToast } from "@/components/ui/Toast"
import { authApi, setSession, ApiError } from "@/lib/api"

const PHONE_REGEX = /^[6-9]\d{9}$/
const RESEND_COOLDOWN_SECS = 30

type Step = "phone" | "otp" | "details"

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: "easeOut" as const },
}

export default function PhoneAuthPage() {
  const router = useRouter()
  const toast = useToast()

  const [step, setStep] = React.useState<Step>("phone")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [name, setName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [fieldError, setFieldError] = React.useState("")
  const [otpError, setOtpError] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [resendIn, setResendIn] = React.useState(0)

  React.useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const sendOtp = async () => {
    if (!PHONE_REGEX.test(phone)) {
      setFieldError("Sahi 10-digit mobile number daalo (6-9 se shuru)")
      return
    }
    setFieldError("")
    setLoading(true)
    try {
      await authApi.sendOtp(phone)
      toast.success(`OTP bheja gaya +91 ${phone} par`)
      setOtp("")
      setOtpError(false)
      setResendIn(RESEND_COOLDOWN_SECS)
      setStep("otp")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Kuch galat ho gaya. Phir try karo.")
    } finally {
      setLoading(false)
    }
  }

  const verify = async (otpValue: string, extra?: { name: string; dob: string }) => {
    setLoading(true)
    setOtpError(false)
    try {
      const result = await authApi.verifyOtp({ phone, otp: otpValue, ...extra })
      setSession(result.accessToken, result.user)
      toast.success(`Welcome, ${result.user.name}! 🎉`)
      router.replace("/")
    } catch (err) {
      if (err instanceof ApiError && err.code === "NEW_USER_DETAILS_REQUIRED") {
        // First login on this number — the OTP stays valid on the server,
        // we just need name + DOB to create the account.
        setStep("details")
      } else if (err instanceof ApiError) {
        setOtpError(true)
        toast.error(err.message)
        if (step === "details") setStep("otp")
      } else {
        toast.error("Kuch galat ho gaya. Phir try karo.")
      }
    } finally {
      setLoading(false)
    }
  }

  const submitDetails = async () => {
    if (name.trim().length < 2) {
      setFieldError("Apna naam daalo (kam se kam 2 letters)")
      return
    }
    if (!dob) {
      setFieldError("Date of birth zaroori hai")
      return
    }
    setFieldError("")
    await verify(otp, { name: name.trim(), dob })
  }

  const handleOtpChange = (value: string) => {
    setOtp(value)
    setOtpError(false)
    // Auto-verify as soon as all 6 digits are in; pass the fresh value
    // since the state update hasn't flushed yet
    if (value.length === 6 && !loading) {
      verify(value)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] via-white to-white flex flex-col font-sans text-[#0F172A]">
      {/* Top bar */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-[#475569] hover:text-[#4F46E5] font-semibold text-[15px] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Apna Rank
        </Link>
      </header>

      <main className="flex-1 flex items-start md:items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[420px]">
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-8 overflow-hidden">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div key="phone" {...stepMotion}>
                  <h1 className="text-[28px] font-extrabold tracking-tight mb-2">
                    Apna number daalo
                  </h1>
                  <p className="text-[#64748B] text-[15px] mb-8">
                    OTP se login hoga — password yaad rakhne ki zaroorat nahi.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendOtp()
                    }}
                  >
                    <Label htmlFor="phone">Mobile number</Label>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-[48px] px-4 flex items-center rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] text-[16px] font-semibold text-[#475569] select-none">
                        +91
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        autoFocus
                        maxLength={10}
                        placeholder="98765 43210"
                        value={phone}
                        error={!!fieldError}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          setFieldError("")
                        }}
                      />
                    </div>
                    <ErrorMessage>{fieldError}</ErrorMessage>

                    <Button type="submit" variant="cta" className="mt-6" isLoading={loading}>
                      OTP Bhejo
                    </Button>
                  </form>

                  <p className="flex items-center justify-center gap-1.5 text-[13px] text-[#94A3B8] mt-6">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Aapka number safe hai — sirf login ke liye use hoga
                  </p>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div key="otp" {...stepMotion}>
                  <h1 className="text-[28px] font-extrabold tracking-tight mb-2">
                    OTP daalo
                  </h1>
                  <p className="text-[#64748B] text-[15px] mb-8">
                    6-digit code bheja gaya hai{" "}
                    <span className="font-semibold text-[#0F172A]">+91 {phone}</span> par.{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone")
                        setOtp("")
                        setOtpError(false)
                      }}
                      className="text-[#4F46E5] font-semibold hover:underline"
                    >
                      Number badlo
                    </button>
                  </p>

                  <div className="flex justify-center mb-2">
                    <OTPInput value={otp} onChange={handleOtpChange} error={otpError} disabled={loading} />
                  </div>
                  {otpError && (
                    <p className="text-center text-[13px] text-[#EF4444] mb-2">
                      OTP galat hai ya expire ho gaya
                    </p>
                  )}

                  <Button
                    variant="cta"
                    className="mt-6"
                    isLoading={loading}
                    disabled={otp.length !== 6}
                    onClick={() => verify(otp)}
                  >
                    Verify Karo
                  </Button>

                  <div className="text-center mt-6 text-[14px] text-[#64748B]">
                    {resendIn > 0 ? (
                      <span>
                        Dobara bhejo{" "}
                        <span className="font-mono font-semibold text-[#475569]">{resendIn}s</span> mein
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={loading}
                        className="text-[#4F46E5] font-semibold hover:underline disabled:opacity-50"
                      >
                        OTP dobara bhejo
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "details" && (
                <motion.div key="details" {...stepMotion}>
                  <h1 className="text-[28px] font-extrabold tracking-tight mb-2">
                    Naya account 🎉
                  </h1>
                  <p className="text-[#64748B] text-[15px] mb-8">
                    Pehli baar aaye ho! Bas naam aur date of birth chahiye.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      submitDetails()
                    }}
                  >
                    <div className="mb-5">
                      <Label htmlFor="name">Naam</Label>
                      <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        placeholder="Rahul Kumar"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setFieldError("")
                        }}
                      />
                    </div>

                    <div className="mb-1">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        autoComplete="bday"
                        max={new Date().toISOString().split("T")[0]}
                        value={dob}
                        onChange={(e) => {
                          setDob(e.target.value)
                          setFieldError("")
                        }}
                      />
                      <p className="text-[12px] text-[#94A3B8] mt-1.5">
                        18 se kam umar par parental consent zaroori hai (DPDP Act)
                      </p>
                    </div>
                    <ErrorMessage>{fieldError}</ErrorMessage>

                    <Button type="submit" variant="cta" className="mt-6" isLoading={loading}>
                      Shuru Karo
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-[13px] text-[#94A3B8] mt-6">
            Aage badhne par aap{" "}
            <Link href="#" className="underline hover:text-[#64748B]">Terms</Link> aur{" "}
            <Link href="#" className="underline hover:text-[#64748B]">Privacy Policy</Link> se sehmat hote ho
          </p>
        </div>
      </main>
    </div>
  )
}
