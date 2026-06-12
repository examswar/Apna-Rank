import * as React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[48px] w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-4 py-3 text-[16px] transition-all",
          "placeholder:text-[#94A3B8] focus:outline-none focus:border-[#6366F1] focus:ring-[3px] focus:ring-[rgba(79,70,229,0.25)]",
          "disabled:cursor-not-allowed disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:border-[#E2E8F0]",
          error && "border-[#EF4444] bg-[#FEF2F2] focus:border-[#EF4444]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-[14px] font-medium text-[#334155] mb-[6px]",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export type ErrorMessageProps = React.HTMLAttributes<HTMLParagraphElement>

const ErrorMessage = React.forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) return null

    return (
      <p
        ref={ref}
        className={cn("flex items-center text-[13px] text-[#EF4444] mt-[4px]", className)}
        {...props}
      >
        <AlertCircle className="w-[12px] h-[12px] mr-[4px] shrink-0" />
        {children}
      </p>
    )
  }
)
ErrorMessage.displayName = "ErrorMessage"

export { Input, Label, ErrorMessage }
