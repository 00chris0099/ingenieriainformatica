import { describe, it, expect } from 'vitest'
import { BUILTIN_TEMPLATES } from '@/lib/builtinTemplates'

function windowsOf(template: any): Set<string> {
  const set = new Set<string>(['home'])
  for (const b of template.blocks || []) {
    if (b.windowId) set.add(b.windowId)
  }
  return set
}

describe('Multi-window templates', () => {
  it('has 15 templates (5 store, 5 landing, 5 corporate)', () => {
    expect(BUILTIN_TEMPLATES.length).toBe(15)
    expect(BUILTIN_TEMPLATES.filter(t => t.type === 'store').length).toBe(5)
    expect(BUILTIN_TEMPLATES.filter(t => t.type === 'landing').length).toBe(5)
    expect(BUILTIN_TEMPLATES.filter(t => t.type === 'corporate').length).toBe(5)
  })

  it('every store template is multi-window: home + catalogo + ofertas', () => {
    for (const t of BUILTIN_TEMPLATES.filter(t => t.type === 'store')) {
      const windows = windowsOf(t)
      expect(windows.has('home'), `${t.id} debe tener ventana home`).toBe(true)
      expect(windows.has('catalogo'), `${t.id} debe tener ventana catalogo`).toBe(true)
      expect(windows.has('ofertas'), `${t.id} debe tener ventana ofertas`).toBe(true)
      // Non-global blocks must declare a window
      for (const b of (t.blocks || []) as any[]) {
        if (b.type === 'navbar' || b.type === 'footer') continue
        expect(b.windowId, `${t.id}: bloque ${b.id} debe declarar windowId`).toBeTruthy()
      }
    }
  })

  it('every store navbar link resolves to a real window or category', () => {
    for (const t of BUILTIN_TEMPLATES.filter(t => t.type === 'store')) {
      const windows = windowsOf(t)
      const navbar: any = t.blocks.find((b: any) => b.type === 'navbar')
      const links = navbar?.content?.links || []
      for (const link of links) {
        if (link.windowId === 'whatsapp' || link.windowId === 'home') continue
        if (link.categoryId) {
          // category links go to the catalogo window
          expect(link.windowId, `${t.id}: enlace categoría ${link.label} debe apuntar a catalogo`).toBe('catalogo')
        } else {
          expect(windows.has(link.windowId), `${t.id}: enlace ${link.label} -> ventana inexistente ${link.windowId}`).toBe(true)
        }
      }
    }
  })

  it('every corporate template has multiple windows with matching navbar links', () => {
    for (const t of BUILTIN_TEMPLATES.filter(t => t.type === 'corporate')) {
      const windows = windowsOf(t)
      expect(windows.size, `${t.id} debe tener más de una ventana`).toBeGreaterThan(1)
      const navbar: any = t.blocks.find((b: any) => b.type === 'navbar')
      const links = navbar?.content?.links || []
      for (const link of links) {
        if (link.windowId === 'home' || link.windowId === 'whatsapp') continue
        expect(windows.has(link.windowId), `${t.id}: enlace ${link.label} -> ventana inexistente ${link.windowId}`).toBe(true)
      }
    }
  })

  it('landing templates remain single-window', () => {
    for (const t of BUILTIN_TEMPLATES.filter(t => t.type === 'landing')) {
      const windows = windowsOf(t)
      expect(windows.size, `${t.id} debe ser de una sola ventana`).toBe(1)
    }
  })
})
