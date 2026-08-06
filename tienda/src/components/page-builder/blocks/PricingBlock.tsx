'use client'

import { Block, ThemeConfig } from '@repo/blocks'
import { Check } from 'lucide-react'

interface Props { block: Block; theme?: ThemeConfig }

export default function PricingBlock({ block, theme }: Props) {
  const { content } = block
  const items = content.items || []

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.background || '#ffffff' }}>
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: theme?.colors?.text || '#111827' }}>
            {content.title}
          </h2>
        )}
        {content.subtitle && (
          <p className="text-center mb-12" style={{ color: theme?.colors?.muted || '#6b7280' }}>{content.subtitle}</p>
        )}
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((item: any, i: number) => (
            <div
              key={i}
              className={`rounded-2xl p-8 text-center ${item.highlighted ? 'ring-2 scale-105 shadow-xl' : 'shadow-sm border'}`}
              style={{
                backgroundColor: item.highlighted ? (theme?.colors?.primary || '#2563eb') : '#ffffff',
                color: item.highlighted ? '#ffffff' : (theme?.colors?.text || '#111827'),
                borderColor: item.highlighted ? 'transparent' : '#e5e7eb',
              }}
            >
              <h3 className="text-xl font-bold mb-2">{item.name}</h3>
              <div className="text-4xl font-bold mb-6">
                {block.settings.currency || '$'}{item.price}
                <span className="text-sm font-normal opacity-70">{block.settings.period || '/mes'}</span>
              </div>
              <ul className="space-y-3 mb-8 text-left">
                {(item.features || []).map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="block py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: item.highlighted ? '#ffffff' : (theme?.colors?.primary || '#2563eb'),
                  color: item.highlighted ? (theme?.colors?.primary || '#2563eb') : '#ffffff',
                }}
              >
                Elegir Plan
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
