import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = inputId ? `${inputId}-error` : undefined
    const hintId = inputId ? `${inputId}-hint` : undefined
    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`
            w-full px-4 py-2.5
            bg-surface text-foreground
            border rounded-lg
            placeholder:text-foreground-muted
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-alt
            ${error ? 'border-error-500 focus:ring-error-500' : 'border-border hover:border-border-dark'}
            ${className}
          `}
          {...props}
        />
        {error && <p id={errorId} className="mt-1.5 text-sm text-error-500">{error}</p>}
        {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-foreground-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
