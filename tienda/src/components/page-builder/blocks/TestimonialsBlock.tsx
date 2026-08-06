'use client'

import { Block, ThemeConfig } from '@repo/blocks'
import { Star } from 'lucide-react'

interface Props { block: Block; theme?: ThemeConfig }

export default function TestimonialsBlock({ block, theme }: Props) {
  const { content } = block
  const columns = block.settings.columns || 3
  const items = content.items || []

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.background || '#f9fafb' }}>
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme?.colors?.text || '#111827' }}>
            {content.title}
          </h2>
        )}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item: any, i: number) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              {block.settings.showRating && item.rating && (
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={18} className={s <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
              )}
              <p className="text-gray-600 mb-4 italic">&quot;{item.text}&quot;</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: theme?.colors?.primary || '#2563eb' }}
                >
                  {item.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: theme?.colors?.text || '#111827' }}>{item.name}</p>
                  {item.role && <p className="text-xs" style={{ color: theme?.colors?.muted || '#6b7280' }}>{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
