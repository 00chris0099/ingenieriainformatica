'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'surface-card',
  elevated: 'elevated-card',
  interactive: 'surface-card hover:border-[var(--color-border-strong)] hover:shadow-glass hover:-translate-y-0.5 cursor-pointer',
  glass: 'glass-card',
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({ variant = 'default', padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  action?: ReactNode
}

export function CardHeader({ title, description, action, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between ${className}`} {...props}>
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
