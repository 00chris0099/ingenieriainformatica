'use client'

import { Block, ThemeConfig, SEOConfig } from '@repo/blocks'
import { ThemeProvider } from './ThemeProvider'
import BlockRenderer from './BlockRenderer'
import { useEffect } from 'react'

interface UniversalPageRendererProps {
  blocks: Block[]
  theme?: ThemeConfig
  seo?: Partial<SEOConfig>
}

const defaultTheme: ThemeConfig = {
  fonts: { heading: 'Inter', body: 'Inter' },
  colors: { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6', background: '#ffffff', text: '#111827', muted: '#6b7280' },
  spacing: { section: '96px', block: '24px', container: '1200px' },
  borderRadius: '12px',
  shadows: { sm: '0 1px 3px rgba(0,0,0,0.05)', md: '0 4px 12px rgba(0,0,0,0.08)', lg: '0 12px 28px rgba(0,0,0,0.1)' },
}

export default function UniversalPageRenderer({ blocks, theme, seo }: UniversalPageRendererProps) {
  const appliedTheme = theme || defaultTheme

  useEffect(() => {
    if (seo?.metaTitle) document.title = seo.metaTitle
  }, [seo?.metaTitle])

  if (!blocks || blocks.length === 0) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-gray-400">
        <p>Esta pagina no tiene contenido configurado.</p>
      </div>
    )
  }

  return (
    <ThemeProvider theme={appliedTheme}>
      <div
        style={{
          fontFamily: appliedTheme.fonts.body,
          backgroundColor: appliedTheme.colors.background,
          color: appliedTheme.colors.text,
        }}
      >
        {blocks.map(block => (
          <BlockRenderer key={block.id} block={block} theme={appliedTheme} />
        ))}
      </div>
    </ThemeProvider>
  )
}
