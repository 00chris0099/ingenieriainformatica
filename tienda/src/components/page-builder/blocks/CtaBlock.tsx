'use client'

import { Block, ThemeConfig } from '@repo/blocks'

interface Props { block: Block; theme?: ThemeConfig }

export default function CtaBlock({ block, theme }: Props) {
  const { settings, content } = block
  const bgColor = settings.backgroundColor || theme?.colors?.primary || '#2563eb'
  const textColor = settings.textColor || '#ffffff'

  return (
    <section
      className="py-16 px-6 text-center"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
        {content.subtitle && <p className="text-lg opacity-90 mb-8">{content.subtitle}</p>}
        {content.buttonText && (
          <a
            href={content.buttonLink || '#'}
            className="inline-block px-8 py-4 rounded-lg text-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: textColor, color: bgColor }}
          >
            {content.buttonText}
          </a>
        )}
      </div>
    </section>
  )
}
