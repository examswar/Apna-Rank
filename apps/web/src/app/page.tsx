"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { LandingNav } from "@/components/navigation/LandingNav"
import { Users, BookOpen, Globe } from "lucide-react"

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} className="h-full">
        {children}
      </div>
    </motion.div>
  )
}


export default function LandingPage() {

  return (
    <div className="min-h-screen bg-white font-sans text-[#0F172A] selection:bg-indigo-500/30">
      <LandingNav />

      {/* HERO SECTION */}
      <section className="p-6 w-full max-w-[1400px] mx-auto mt-2">
        <div 
          className="relative w-full rounded-[24px] overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop')` }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-[rgba(243,232,255,0.98)] via-[rgba(243,232,255,0.9)] to-[rgba(243,232,255,0.5)] md:from-[rgba(243,232,255,0.92)] md:via-transparent md:to-[rgba(243,232,255,0.35)]"></div>
          
          <div className="relative z-10 w-full px-6 md:px-16 py-16">
            <motion.div 
              className="w-full lg:max-w-[55%]"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1 
                variants={fadeInUp}
                className="text-[40px] md:text-[56px] font-extrabold leading-[1.15] mb-6 text-[#312E81] tracking-tight"
              >
                Apna Rank Badhao with Smart Diagnosis
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-[#475569] text-[18px] mb-8 font-medium leading-relaxed max-w-lg"
              >
                Know exactly why you got it wrong. Get one clear task daily. Improve every single day.
              </motion.p>
              
              <motion.div variants={fadeInUp}>
                <Link href="/auth/phone">
                  <Button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm py-[16px] px-[40px] h-auto text-[16px] font-bold rounded-full transition-transform hover:-translate-y-0.5">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="px-4 md:px-6 w-full max-w-[1400px] mx-auto md:-mt-14 -mt-10 relative z-20 mb-16">
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-[16px] p-4 md:p-6 max-w-4xl mx-auto flex flex-row items-center justify-between divide-x divide-[#E2E8F0]">
          <div className="flex-1 flex flex-col items-center text-center px-2 md:px-4">
            <Users className="w-5 h-5 text-[#4F46E5] mb-2" />
            <div className="text-[24px] font-bold text-[#0F172A] leading-tight">28L+</div>
            <div className="text-[13px] text-[#64748B] font-medium">Aspirants</div>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2 md:px-4">
            <BookOpen className="w-5 h-5 text-[#4F46E5] mb-2" />
            <div className="text-[24px] font-bold text-[#0F172A] leading-tight">500+</div>
            <div className="text-[13px] text-[#64748B] font-medium">Tests</div>
          </div>
          <div className="flex-1 flex flex-col items-center text-center px-2 md:px-4">
            <Globe className="w-5 h-5 text-[#4F46E5] mb-2" />
            <div className="text-[24px] font-bold text-[#0F172A] leading-tight">Hindi</div>
            <div className="text-[13px] text-[#64748B] font-medium">First</div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-24 px-4 md:px-8 bg-slate-50 border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TiltCard className="group relative">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} 
                className="flex flex-col h-full bg-white p-8 rounded-[24px] border border-transparent group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all duration-300 shadow-sm hover:shadow-xl relative before:absolute before:inset-0 before:-z-10 before:rounded-[24px] before:p-[2px] before:bg-gradient-to-br before:from-transparent before:to-transparent group-hover:before:from-red-400 group-hover:before:to-orange-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-[16px] flex items-center justify-center text-[32px] mb-6 shadow-inner group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                  🧬
                </div>
                <h3 className="text-[24px] font-black text-[#0F172A] mb-3 tracking-tight">Mistake DNA</h3>
                <p className="text-[#475569] text-[18px] leading-relaxed">
                  Know the root cause of every wrong answer
                </p>
              </motion.div>
            </TiltCard>
            
            <TiltCard className="group relative">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} 
                className="flex flex-col h-full bg-white p-8 rounded-[24px] border border-transparent group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300 shadow-sm hover:shadow-xl relative before:absolute before:inset-0 before:-z-10 before:rounded-[24px] before:p-[2px] before:bg-gradient-to-br before:from-transparent before:to-transparent group-hover:before:from-purple-400 group-hover:before:to-indigo-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-[16px] flex items-center justify-center text-[32px] mb-6 shadow-inner group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                  🎯
                </div>
                <h3 className="text-[24px] font-black text-[#0F172A] mb-3 tracking-tight">Strategy Score</h3>
                <p className="text-[#475569] text-[18px] leading-relaxed">
                  See your Knowledge vs Strategy gap
                </p>
              </motion.div>
            </TiltCard>

            <TiltCard className="group relative">
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} 
                className="flex flex-col h-full bg-white p-8 rounded-[24px] border border-transparent group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-300 shadow-sm hover:shadow-xl relative before:absolute before:inset-0 before:-z-10 before:rounded-[24px] before:p-[2px] before:bg-gradient-to-br before:from-transparent before:to-transparent group-hover:before:from-green-400 group-hover:before:to-emerald-400"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-[16px] flex items-center justify-center text-[32px] mb-6 shadow-inner group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                  ✅
                </div>
                <h3 className="text-[24px] font-black text-[#0F172A] mb-3 tracking-tight">Aaj ka Ek Kaam</h3>
                <p className="text-[#475569] text-[18px] leading-relaxed">
                  One clear next step, every day
                </p>
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* EXAMS SECTION */}
      <section id="exams" className="py-24 px-4 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-hi text-[36px] md:text-[48px] font-black text-[#0F172A] mb-4 tracking-tight">
              Target Your Exam
            </h2>
            <p className="text-[#64748B] text-[20px] font-medium max-w-2xl mx-auto">
              Specialized diagnosis for India&apos;s top competitive exams
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}
          >
            {[
              { name: "SSC", icon: "📋", count: "28L+ students" },
              { name: "Railway", icon: "🚂", count: "25L+ students" },
              { name: "UPSC", icon: "🏛️", count: "10L+ students" },
              { name: "NEET", icon: "🔬", count: "20L+ students" },
              { name: "JEE", icon: "⚗️", count: "12L+ students" },
              { name: "Boards", icon: "📚", count: "1Cr+ students" }
            ].map((exam) => (
              <motion.div key={exam.name} variants={fadeInUp}>
                <div className="bg-slate-50 border border-[#E2E8F0] rounded-[16px] p-6 flex flex-row items-center hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.05)] hover:border-indigo-200 transition-all duration-300 cursor-pointer h-full gap-5 group">
                  <div className="w-14 h-14 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-[28px] group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                    {exam.icon}
                  </div>
                  <div>
                    <h4 className="text-[22px] font-bold text-[#0F172A] group-hover:text-indigo-600 transition-colors">{exam.name}</h4>
                    <p className="text-[#64748B] font-semibold text-[14px]">
                      {exam.count}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 md:px-8 bg-slate-50 border-t border-[#E2E8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-[36px] md:text-[48px] font-black text-[#0F172A] mb-4 tracking-tight">
              How It Works
            </h2>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-stretch gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-1 bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent opacity-30 z-0"></div>

            {[
              { step: "1", title: "Take a Test", desc: "Attempt mock tests on our platform with standard timers and negative marking." },
              { step: "2", title: "See Your Diagnosis", desc: "Understand the root cause behind every wrong answer with our Mistake DNA." },
              { step: "3", title: "Improve Daily", desc: "Our AI gives you a daily targeted task based entirely on your weakest areas." }
            ].map((item, idx) => (
              <motion.div 
                key={item.step} 
                initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: idx * 0.2, type: "spring", bounce: 0.3 }}
                className="flex-1 w-full bg-transparent z-10 relative"
              >
                <div className="flex flex-col items-center text-center p-8 bg-white rounded-[24px] border border-[#E2E8F0] shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-300 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#4F46E5] to-[#312E81] text-white rounded-full flex items-center justify-center text-[28px] font-black mb-6 shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-50">
                    {item.step}
                  </div>
                  <h4 className="text-[24px] font-bold text-[#0F172A] mb-3">{item.title}</h4>
                  <p className="text-[#475569] text-[16px] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-28 px-4 md:px-8 bg-gradient-to-br from-[#4F46E5] to-[#312E81] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl mix-blend-overlay"></div>
        
        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
        >
          <h2 className="text-[40px] md:text-[56px] font-black text-white mb-8 tracking-tight leading-tight">
            Start Free Today
          </h2>
          <Link href="/auth/phone">
            <Button className="relative overflow-hidden w-full sm:w-auto bg-white text-[#4F46E5] hover:bg-neutral-50 hover:text-indigo-700 border-none shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] h-16 px-12 text-[20px] font-black rounded-[14px] transition-all hover:scale-105 group">
              <span className="relative z-10">Get Started Free</span>
              <motion.div 
                className="absolute inset-0 w-[50%] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent skew-x-12 z-0"
                animate={{ x: ['-200%', '300%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
              />
            </Button>
          </Link>
          <p className="text-white/80 mt-6 text-[18px] font-medium tracking-wide">
            No credit card required
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white font-black text-[24px]">Apna Rank</div>
          <div className="flex items-center gap-8 text-[#94A3B8] font-medium text-[15px]">
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
