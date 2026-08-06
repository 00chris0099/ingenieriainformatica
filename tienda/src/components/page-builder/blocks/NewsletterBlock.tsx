'use client'

import { Block, ThemeConfig } from '@repo/blocks'

interface Props { block: Block; theme?: ThemeConfig }

export default function NewsletterBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.primary || '#2563eb', color: '#ffffff' }}>
      <div className="max-w-xl mx-auto text-center">
        {content.title && <h2 className="text-2xl font-bold mb-2">{content.title}</h2>}
        {content.subtitle && <p className="opacity-90 mb-6">{content.subtitle}</p>}
        <form className="flex gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
          <input
            type="email"
            placeholder={content.placeholder || 'Tu email'}
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm outline-none"
          />
          <button type="submit" className="px-6 py-3 rounded-lg font-semibold text-sm bg-white hover:bg-gray-100 transition-colors" style={{ color: theme?.colors?.primary || '#2563eb' }}>
            {content.buttonText || 'Suscribir'}
          </button>
        </form>
      </div>
    </section>
  )
}
