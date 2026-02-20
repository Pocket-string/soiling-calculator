import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = selectId ? `${selectId}-error` : undefined
    const hintId = selectId ? `${selectId}-hint` : undefined
    const describedBy = error ? errorId : hint ? hintId : undefined

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`
            w-full px-4 py-2.5
            bg-surface text-foreground
            border rounded-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error-500' : 'border-border hover:border-border-dark'}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p id={errorId} className="mt-1.5 text-sm text-error-500">{error}</p>}
        {hint && !error && <p id={hintId} className="mt-1.5 text-sm text-foreground-muted">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
