'use client'

import { useEffect, useCallback, ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: ReactNode
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${sizeClasses[size]} w-full animate-modal-in`}
        onClick={e => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="mb-5">
            <div className="flex items-center justify-between">
              {title && <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {description && (
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{description}</p>
            )}
          </div>
        )}
        {children}
        {footer && (
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
