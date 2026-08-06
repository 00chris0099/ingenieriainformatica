'use client'

import { ThemeConfig } from '@repo/blocks'
import { createContext, useContext } from 'react'

const ThemeContext = createContext<ThemeConfig | null>(null)

export function useTheme(): ThemeConfig | null {
  return useContext(ThemeContext)
}

const fallback = {
  colors: { primary: '#2563eb', secondary: '#7c3aed', accent: '#f59e0b', background: '#ffffff', text: '#111827', muted: '#6b7280' },
  fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
  spacing: { section: '4rem', block: '2rem', container: '1200px' },
  borderRadius: '0.5rem',
  shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)' },
}

export function ThemeProvider({ theme, children }: { theme: ThemeConfig; children: React.ReactNode }) {
  const t = theme || fallback
  const c = t.colors || fallback.colors
  const f = t.fonts || fallback.fonts
  const s = t.spacing || fallback.spacing
  const sh = t.shadows || fallback.shadows

  const style = {
    '--color-primary': c.primary,
    '--color-secondary': c.secondary,
    '--color-accent': c.accent,
    '--color-background': c.background,
    '--color-text': c.text,
    '--color-muted': c.muted,
    '--font-heading': f.heading,
    '--font-body': f.body,
    '--spacing-section': s.section,
    '--spacing-block': s.block,
    '--spacing-container': s.container,
    '--border-radius': t.borderRadius,
    '--shadow-sm': sh.sm,
    '--shadow-md': sh.md,
    '--shadow-lg': sh.lg,
  } as React.CSSProperties

  return (
    <ThemeContext.Provider value={t}>
      <div style={style} className="page-builder-themed">
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
