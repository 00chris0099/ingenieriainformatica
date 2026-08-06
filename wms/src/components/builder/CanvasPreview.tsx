'use client'

import { Block } from '@repo/blocks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit3, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-react'

interface CanvasPreviewProps {
  blocks: Block[]
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  onMoveBlock: (id: string, direction: 'up' | 'down') => void
  onDuplicateBlock: (id: string) => void
  onDeleteBlock: (id: string) => void
  previewMode: 'desktop' | 'tablet' | 'mobile'
}

const blockTypeLabels: Record<string, string> = {
  hero: 'Hero Section',
  features: 'Features Grid',
  cta: 'Call to Action',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  footer: 'Footer',
  'product-grid': 'Product Grid',
  pricing: 'Pricing Table',
  newsletter: 'Newsletter',
  text: 'Text Block',
  image: 'Image',
  gallery: 'Gallery',
  columns: 'Columns',
  countdown: 'Countdown',
  contact: 'Contact Form',
  'social-proof': 'Social Proof',
  accordion: 'Accordion',
}

const blockColors: Record<string, string> = {
  hero: 'border-l-[var(--color-info)] bg-[var(--color-info-muted)]',
  features: 'border-l-[var(--color-accent)] bg-[var(--color-accent-muted)]',
  cta: 'border-l-[var(--color-success)] bg-[var(--color-success-muted)]',
  testimonials: 'border-l-[var(--color-warning)] bg-[var(--color-warning-muted)]',
  faq: 'border-l-[var(--color-warning)] bg-[var(--color-warning-muted)]',
  footer: 'border-l-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]',
  'product-grid': 'border-l-[var(--color-accent)] bg-[var(--color-accent-muted)]',
  pricing: 'border-l-[var(--color-info)] bg-[var(--color-info-muted)]',
  newsletter: 'border-l-[var(--color-accent)] bg-[var(--color-accent-muted)]',
  text: 'border-l-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]',
  image: 'border-l-[var(--color-success)] bg-[var(--color-success-muted)]',
  gallery: 'border-l-[var(--color-success)] bg-[var(--color-success-muted)]',
  columns: 'border-l-[var(--color-info)] bg-[var(--color-info-muted)]',
  countdown: 'border-l-[var(--color-error)] bg-[var(--color-error-muted)]',
  contact: 'border-l-[var(--color-info)] bg-[var(--color-info-muted)]',
  'social-proof': 'border-l-[var(--color-warning)] bg-[var(--color-warning-muted)]',
  accordion: 'border-l-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]',
}

interface SortableBlockProps {
  block: Block
  index: number
  totalBlocks: number
  isSelected: boolean
  onSelect: () => void
  onMove: (direction: 'up' | 'down') => void
  onDuplicate: () => void
  onDelete: () => void
}

function SortableBlock({ block, index, totalBlocks, isSelected, onSelect, onMove, onDuplicate, onDelete }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  }

  const colorClass = blockColors[block.type] || 'border-l-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)]'

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative group mb-3 rounded-xl border-l-4 transition-all ${
        isSelected
          ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent-muted)] shadow-lg'
          : `border-transparent hover:border-l-[var(--color-border-strong)]`
      }`}
    >
      {/* Floating toolbar */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border)] shadow-lg transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
        </button>
        <span className="text-xs font-medium text-[var(--color-text-secondary)] px-1">{blockTypeLabels[block.type] || block.type}</span>
        <div className="w-px h-3 bg-[var(--color-border)]" />
        <button onClick={(e) => { e.stopPropagation(); onMove('up') }}
          disabled={index === 0}
          className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onMove('down') }}
          disabled={index === totalBlocks - 1}
          className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 transition-colors">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-[var(--color-border)]" />
        <button onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-info)] transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className={`${colorClass} rounded-xl p-4 min-h-[80px]`}>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Edit3 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{block.content?.title || blockTypeLabels[block.type] || block.type}</span>
        </div>
        {block.content?.subtitle && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1 ml-6 truncate">{block.content.subtitle}</p>
        )}
        {block.type === 'hero' && (
          <div className="mt-2 ml-6 flex gap-2">
            <div className="px-3 py-1 bg-[var(--color-accent)] text-white text-xs rounded-lg">{block.content?.buttonText || 'Button'}</div>
            {block.content?.secondaryButtonText && (
              <div className="px-3 py-1 border border-[var(--color-border-strong)] text-xs rounded-lg">{block.content.secondaryButtonText}</div>
            )}
          </div>
        )}
        {block.type === 'features' && block.content?.items && (
          <div className="mt-2 ml-6 grid grid-cols-3 gap-2">
            {block.content.items.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-surface)] rounded-lg p-2 border border-[var(--color-border)]">
                <div className="font-medium">{item.title}</div>
              </div>
            ))}
          </div>
        )}
        {block.type === 'pricing' && block.content?.items && (
          <div className="mt-2 ml-6 flex gap-2">
            {block.content.items.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className={`text-xs rounded-lg p-2 flex-1 border ${item.highlighted ? 'bg-[var(--color-accent-muted)] border-[var(--color-accent)]' : 'bg-[var(--color-bg-surface)] border-[var(--color-border)]'}`}>
                <div className="font-medium">{item.name}</div>
                <div className="text-[var(--color-text-tertiary)]">${item.price}/mo</div>
              </div>
            ))}
          </div>
        )}
        {block.type === 'testimonials' && block.content?.items && (
          <div className="mt-2 ml-6 flex gap-2">
            {block.content.items.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="text-xs bg-[var(--color-bg-surface)] rounded-lg p-2 flex-1 border border-[var(--color-border)]">
                <div className="font-medium">{item.name}</div>
                <div className="text-[var(--color-text-tertiary)]">{item.text?.substring(0, 40)}...</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CanvasPreview({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  previewMode,
}: CanvasPreviewProps) {
  const containerWidth = previewMode === 'desktop' ? 'w-full' : previewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[375px]'

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-hover)] border border-[var(--color-border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">No blocks yet</h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">Add blocks from the palette to start building your page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-base)] p-6">
      <div className={`${containerWidth} mx-auto transition-all duration-300`}>
        {blocks.map((block, index) => (
          <SortableBlock
            key={block.id}
            block={block}
            index={index}
            totalBlocks={blocks.length}
            isSelected={block.id === selectedBlockId}
            onSelect={() => onSelectBlock(block.id)}
            onMove={(dir) => onMoveBlock(block.id, dir)}
            onDuplicate={() => onDuplicateBlock(block.id)}
            onDelete={() => onDeleteBlock(block.id)}
          />
        ))}
      </div>
    </div>
  )
}
