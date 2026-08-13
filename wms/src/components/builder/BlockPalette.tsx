'use client'

import { useState } from 'react'
import { blockRegistry } from '@repo/blocks'
import { useDraggable } from '@dnd-kit/core'
import { Layout, Grid3x3, ShoppingCart, Users, Search, GripVertical } from 'lucide-react'

const categoryIcons: Record<string, any> = {
  layout: Layout,
  content: Grid3x3,
  commerce: ShoppingCart,
  social: Users,
  seo: Layout,
}

interface DraggableBlockProps {
  block: { id: string; name: string; description: string }
  onAddBlock: (type: string) => void
  categoryIcon: any
}

function DraggableBlock({ block, onAddBlock, categoryIcon: Icon }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.id}`,
    data: { type: block.id, fromPalette: true },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAddBlock(block.id)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all group
        text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]
        ${isDragging ? 'opacity-50 z-50' : ''}`}
      title={block.description}
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-border-strong)] transition-colors">
        <Icon className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent)]" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <div className="font-medium truncate">{block.name}</div>
        <div className="text-xs text-[var(--color-text-tertiary)] truncate">{block.description}</div>
      </div>
      <GripVertical className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

interface BlockPaletteProps {
  onAddBlock: (type: string) => void
  industry?: string
}

export default function BlockPalette({ onAddBlock, industry }: BlockPaletteProps) {
  const [search, setSearch] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('layout')

  const categories = industry
    ? blockRegistry.getCategories().map(cat => ({
        ...cat,
        blocks: cat.blocks.filter(b => {
          const industryBlocks = blockRegistry.getByIndustry(industry)
          return industryBlocks.some(ib => ib.id === b.id)
        }),
      })).filter(cat => cat.blocks.length > 0)
    : blockRegistry.getCategories()

  const filteredCategories = categories.map(cat => ({
    ...cat,
    blocks: cat.blocks.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.blocks.length > 0)

  return (
    <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] flex flex-col h-full">
      <div className="p-3 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Blocks</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search blocks..."
            aria-label="Buscar bloques"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredCategories.map(category => {
          const Icon = categoryIcons[category.id] || Layout
          const isExpanded = expandedCategory === category.id

          return (
            <div key={category.id}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                aria-expanded={isExpanded}
                aria-controls={`palette-category-${category.id}`}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">{category.blocks.length}</span>
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div id={`palette-category-${category.id}`} className="ml-4 space-y-1 pb-2">
                  {category.blocks.map(block => (
                    <DraggableBlock
                      key={block.id}
                      block={block}
                      onAddBlock={onAddBlock}
                      categoryIcon={Icon}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
