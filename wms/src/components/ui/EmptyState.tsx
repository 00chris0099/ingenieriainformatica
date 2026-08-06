import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  className?: string
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center mb-5">
        {icon || <Inbox className="w-7 h-7 text-[var(--color-text-tertiary)]" />}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--color-text-tertiary)] max-w-sm mb-5">{description}</p>
      )}
      {action && (
        <Button variant={action.variant || 'primary'} size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
