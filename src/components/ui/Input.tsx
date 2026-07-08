import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement | null, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;

    // Ensure the input has proper ARIA support for error states
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId || helperId || undefined}
          className={cn(
            "w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:border-navy-500",
            "placeholder:text-gray-400",
            error ? "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500" : "border-gray-300",
            className
          )}
          {...props}
        />
        {error && <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
        {helperText && !error && <p id={helperId} className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
