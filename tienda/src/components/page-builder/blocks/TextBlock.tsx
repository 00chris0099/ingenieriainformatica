'use client'

import { Block, ThemeConfig } from '@repo/blocks'

interface Props { block: Block; theme?: ThemeConfig }

export default function TextBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <section className="py-12 px-6" style={{ backgroundColor: theme?.colors?.background || '#ffffff' }}>
      <div className="max-w-3xl mx-auto">
        {content.title && <h2 className="text-3xl font-bold mb-4" style={{ color: theme?.colors?.text || '#111827' }}>{content.title}</h2>}
        {content.subtitle && <p className="text-lg mb-4" style={{ color: theme?.colors?.muted || '#6b7280' }}>{content.subtitle}</p>}
      </div>
    </section>
  )
}
