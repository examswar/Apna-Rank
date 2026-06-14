"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowLeft, ArrowRight, Save, PlusCircle, Trash2, CheckCircle2, Rocket } from "lucide-react"

export default function CreateTestWizard() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  
  // Step 1 State
  const [title, setTitle] = React.useState("")
  
  // Step 2 State (mock question list)
  const [questions, setQuestions] = React.useState([1])

  const steps = [
    { id: 1, title: "Details" },
    { id: 2, title: "Questions" },
    { id: 3, title: "Pricing" },
    { id: 4, title: "Publish" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/teacher/tests")} className="p-2 -ml-2 rounded-full hover:bg-[#E2E8F0] transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#0F172A]" />
        </button>
        <div>
          <h1 className="text-[24px] font-black text-[#0F172A] tracking-tight mb-1">Create New Test</h1>
          <p className="text-[#64748B] font-medium">Follow the steps to publish your test.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-[16px] border border-[#E2E8F0] shadow-sm flex items-center justify-between">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px] transition-colors ${
                step === s.id ? "bg-[#4F46E5] text-white ring-4 ring-[#EEF2FF]" :
                step > s.id ? "bg-[#10B981] text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-[12px] font-bold uppercase tracking-wider ${
                step >= s.id ? "text-[#0F172A]" : "text-[#94A3B8]"
              }`}>{s.title}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-1 flex-1 rounded-full mx-2 ${
                step > s.id ? "bg-[#10B981]" : "bg-[#E2E8F0]"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card className="p-6 border-[#E2E8F0] shadow-sm bg-white animate-in slide-in-from-right-4 fade-in">
          <h2 className="text-[18px] font-bold text-[#0F172A] mb-6">Test Details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[14px] font-bold text-[#334155] mb-2">Test Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., SSC CGL Tier 1 Mock (2026 Pattern)"
                className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/20"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Exam Category *</label>
                <select className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] bg-white">
                  <option>SSC CGL</option>
                  <option>Railway NTPC</option>
                  <option>UPSC Prelims</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Subject</label>
                <input type="text" placeholder="e.g., Quantitative Aptitude" className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] focus:ring-[3px] focus:ring-[#4F46E5]/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Duration (mins) *</label>
                <input type="number" defaultValue="60" className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5]" />
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Negative Marking</label>
                <select className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] bg-white">
                  <option>-0.25</option>
                  <option>-0.33</option>
                  <option>None</option>
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-bold text-[#334155] mb-2">Language</label>
                <select className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] bg-white">
                  <option>Hindi</option>
                  <option>English</option>
                  <option>Bilingual</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#0F172A]">Add Questions ({questions.length} added)</h2>
            <Button variant="secondary" onClick={() => setQuestions([...questions, questions.length + 1])} className="h-[40px] px-4 text-[13px]">
              <PlusCircle className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>
          
          {questions.map((q, idx) => (
            <Card key={idx} className="p-6 border-[#E2E8F0] shadow-sm bg-white">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-[#475569]">Question {idx + 1}</h3>
                <button className="text-[#EF4444] hover:bg-[#FEF2F2] p-2 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-bold text-[#334155] mb-2">Question Text *</label>
                  <textarea rows={3} placeholder="Enter question in Hindi/English..." className="w-full p-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] resize-none"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className="flex items-center gap-3">
                      <input type="radio" name={`q${idx}_correct`} className="w-5 h-5 text-[#10B981] focus:ring-[#10B981]" />
                      <input type="text" placeholder={`Option ${opt}`} className="w-full h-[48px] px-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5]" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#334155] mb-2">Explanation (Optional)</label>
                  <textarea rows={2} placeholder="Why is this answer correct?" className="w-full p-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:border-[#4F46E5] resize-none"></textarea>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <Card className="p-6 border-[#E2E8F0] shadow-sm bg-white animate-in slide-in-from-right-4 fade-in">
          <h2 className="text-[18px] font-bold text-[#0F172A] mb-6">Pricing</h2>
          <div className="max-w-[400px] space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0]">
              <div>
                <div className="font-bold text-[#0F172A]">Make this test free?</div>
                <div className="text-[13px] text-[#64748B]">Good for building an audience</div>
              </div>
              <input type="checkbox" className="w-6 h-6 rounded text-[#4F46E5] focus:ring-[#4F46E5]" />
            </div>
            
            <div>
              <label className="block text-[14px] font-bold text-[#334155] mb-2">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#64748B]">₹</span>
                <input type="number" defaultValue="49" className="w-full h-[52px] pl-8 pr-4 rounded-[10px] border-[1.5px] border-[#E2E8F0] text-[18px] font-bold text-[#0F172A] focus:outline-none focus:border-[#4F46E5]" />
              </div>
              <p className="text-[13px] font-medium text-[#10B981] mt-2">You will earn ₹29.40 (60%) per sale</p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Publish */}
      {step === 4 && (
        <Card className="p-8 border border-[#E2E8F0] shadow-sm bg-white text-center animate-in slide-in-from-right-4 fade-in">
          <div className="w-20 h-20 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <h2 className="text-[24px] font-black text-[#0F172A] mb-2">Ready for launch!</h2>
          <p className="text-[#64748B] font-medium mb-8 max-w-[400px] mx-auto">
            "{title || "Untitled Test"}" has {questions.length} questions and is priced at ₹49. Once published, students can immediately purchase and attempt it.
          </p>
          
          <div className="bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E2E8F0] max-w-[400px] mx-auto text-left flex items-start gap-3 mb-8">
            <input type="checkbox" id="confirm" className="mt-1 w-5 h-5 rounded text-[#4F46E5] focus:ring-[#4F46E5]" />
            <label htmlFor="confirm" className="text-[13px] font-medium text-[#475569]">
              I confirm this content is my original work and does not violate any copyright laws.
            </label>
          </div>
          
          <Button onClick={() => router.push("/teacher/dashboard")} className="h-[56px] px-10 text-[18px]">
            Publish to Marketplace
          </Button>
        </Card>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 z-40 lg:pl-[240px]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <Button variant="ghost" className="text-[#64748B] hover:text-[#0F172A]">
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={() => setStep(step - 1)} 
              disabled={step === 1}
              className="bg-white"
            >
              Back
            </Button>
            {step < 4 && (
              <Button onClick={() => setStep(step + 1)}>
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
