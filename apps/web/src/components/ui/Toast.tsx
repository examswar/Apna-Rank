"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Info } from "lucide-react"
import { create } from "zustand"
import { cn } from "@/lib/utils"

export type ToastVariant = "success" | "error" | "info"

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, variant: ToastVariant) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, variant) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const addToast = useToastStore((state) => state.addToast)
  return {
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  }
}

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 min-w-[300px] max-w-[400px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  React.useEffect(() => {
    const duration = toast.variant === "error" ? 5000 : 3000
    const timer = setTimeout(() => {
      onRemove()
    }, duration)
    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white shrink-0" />,
    error: <XCircle className="w-5 h-5 text-white shrink-0" />,
    info: <Info className="w-5 h-5 text-white shrink-0" />,
  }

  const bgColors = {
    success: "bg-[#22C55E]",
    error: "bg-[#EF4444]",
    info: "bg-[#1E293B]",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-[10px] shadow-lg text-white text-[14px] font-medium cursor-pointer w-full",
        bgColors[toast.variant]
      )}
      onClick={onRemove}
    >
      {icons[toast.variant]}
      <p className="flex-1 leading-snug">{toast.message}</p>
    </motion.div>
  )
}
