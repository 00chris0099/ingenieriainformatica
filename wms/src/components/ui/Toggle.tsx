'use client'

import { InputHTMLAttributes } from 'react'

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  description?: string
}

export function Toggle({ label, description, className = '', ...props }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div className="w-9 h-5 rounded-full bg-[var(--color-border-strong)] peer-checked:bg-accent transition-colors duration-200" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--color-text-primary)] shadow-sm peer-checked:translate-x-4 transition-transform duration-200 ease-[var(--ease-spring)]" />
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>}
          {description && <div className="text-xs text-[var(--color-text-tertiary)]">{description}</div>}
        </div>
      )}
    </label>
  )
}
