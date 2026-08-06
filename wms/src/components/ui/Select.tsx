'use client'

import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className = '', id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            'select-field',
            error ? '!border-[var(--color-error)] focus:!ring-[var(--color-error-muted)]' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        {error && <p className="form-error">{error}</p>}
        {!error && hint && <p className="form-hint">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select, type SelectProps }
