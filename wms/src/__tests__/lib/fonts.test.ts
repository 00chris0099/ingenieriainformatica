import { describe, it, expect } from 'vitest'
import { FONT_OPTIONS, DEFAULT_FONT_ID, resolveFont, fontStack, googleFontsHref } from '@/lib/fonts'

describe('fonts (tipografías del sitio)', () => {
  it('resuelve la fuente por defecto cuando no hay settings', () => {
    expect(resolveFont(undefined).id).toBe(DEFAULT_FONT_ID)
    expect(resolveFont(null).id).toBe(DEFAULT_FONT_ID)
    expect(resolveFont({}).id).toBe(DEFAULT_FONT_ID)
  })

  it('resuelve una fuente conocida por id', () => {
    expect(resolveFont({ fontFamily: 'playfair' }).id).toBe('playfair')
    expect(resolveFont({ fontFamily: 'oswald' }).label).toBe('Oswald')
  })

  it('cae a la fuente por defecto ante un id desconocido', () => {
    expect(resolveFont({ fontFamily: 'no-existe' }).id).toBe(DEFAULT_FONT_ID)
  })

  it('construye el stack CSS con fallbacks', () => {
    const stack = fontStack({ fontFamily: 'playfair' })
    expect(stack).toContain('Playfair Display')
    expect(stack).toContain('serif')
  })

  it('construye la URL de Google Fonts correctamente', () => {
    const href = googleFontsHref({ fontFamily: 'playfair' })
    expect(href).toContain('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@')
    expect(href).toContain('display=swap')
    // Nombres con espacio se codifican con '+'
    const dm = googleFontsHref({ fontFamily: 'dm-sans' })
    expect(dm).toContain('family=DM+Sans:wght@')
  })

  it('el catálogo tiene ids únicos y stacks válidos', () => {
    const ids = FONT_OPTIONS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of FONT_OPTIONS) {
      expect(f.stack).toContain(f.label)
      expect(f.weights.length).toBeGreaterThan(0)
    }
  })
})
