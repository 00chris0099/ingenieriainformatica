'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent text-white',
    'hover:bg-accent-hover',
    'shadow-sm hover:shadow-glow-sm',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
    'border border-[var(--color-border)]',
    'hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]',
    'active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'text-[var(--color-text-secondary)]',
    'hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
    'active:scale-[0.98]',
  ].join(' '),
  danger: [
    'bg-[var(--color-error-muted)] text-[var(--color-error)]',
    'hover:bg-[var(--color-error)] hover:text-white',
    'active:scale-[0.98]',
  ].join(' '),
  link: [
    'text-accent p-0 h-auto',
    'hover:text-accent-hover hover:underline',
  ].join(' '),
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-sm gap-2.5 rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, className = '', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-[var(--ease-in-out)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]',
          'disabled:opacity-40 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize }
