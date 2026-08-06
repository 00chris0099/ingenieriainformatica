'use client'

import { Block, ThemeConfig } from '@repo/blocks'
import { useState } from 'react'

interface Props { block: Block; theme?: ThemeConfig }

export default function FaqBlock({ block, theme }: Props) {
  const { content } = block
  const items = content.items || []

  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.background || '#ffffff' }}>
      <div className="max-w-3xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme?.colors?.text || '#111827' }}>
            {content.title}
          </h2>
        )}
        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <FaqItem key={i} question={item.question} answer={item.answer} theme={theme} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ question, answer, theme }: { question: string; answer: string; theme?: ThemeConfig }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: `${theme?.colors?.muted || '#e5e7eb'}30` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left font-medium transition-colors hover:bg-gray-50"
        style={{ color: theme?.colors?.text || '#111827' }}
      >
        {question}
        <span className={`text-xl transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-4" style={{ color: theme?.colors?.muted || '#6b7280' }}>
          {answer}
        </div>
      )}
    </div>
  )
}
