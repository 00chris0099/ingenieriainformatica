import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode | {
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
        action && typeof action === 'object' && 'label' in action && typeof (action as any).label === 'string' ? (
          <Button variant={(action as any).variant || 'primary'} size="sm" onClick={(action as any).onClick}>
            {(action as any).label}
          </Button>
        ) : (
          action as ReactNode
        )
      )}
    </div>
  )
}
