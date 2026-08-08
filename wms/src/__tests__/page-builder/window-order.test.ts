import { describe, it, expect } from 'vitest'
import { reorderLinksByStoredOrder, windowIdsFromLinks } from '@/lib/window-order'

const link = (windowId: string, label?: string) => ({ label: label || windowId, windowId })

describe('windowIdsFromLinks', () => {
  it('extracts ordered window ids', () => {
    const links = [link('inicio'), link('nosotros'), link('contacto')]
    expect(windowIdsFromLinks(links)).toEqual(['inicio', 'nosotros', 'contacto'])
  })

  it('excludes whatsapp, product landings and empty ids', () => {
    const links = [
      link('catalogo'),
      link('whatsapp', 'Pedir'),
      link('product:p1'),
      { label: 'vacío' },
      link('ofertas'),
    ]
    expect(windowIdsFromLinks(links)).toEqual(['catalogo', 'ofertas'])
  })
})

describe('reorderLinksByStoredOrder', () => {
  it('reorders known windows to match the stored order', () => {
    const links = [link('a'), link('b'), link('c'), link('d')]
    const order = ['c', 'a', 'd', 'b']
    expect(reorderLinksByStoredOrder(links, order).map((l: any) => l.windowId)).toEqual(['c', 'a', 'd', 'b'])
  })

  it('appends unknown windows at the end keeping their relative order', () => {
    const links = [link('a'), link('x'), link('b'), link('y'), link('c')]
    const order = ['c', 'a', 'b']
    expect(reorderLinksByStoredOrder(links, order).map((l: any) => l.windowId)).toEqual(['c', 'a', 'b', 'x', 'y'])
  })

  it('returns the same array when stored order is empty', () => {
    const links = [link('a'), link('b')]
    expect(reorderLinksByStoredOrder(links, []).map((l: any) => l.windowId)).toEqual(['a', 'b'])
  })

  it('handles empty links and does not mutate the input', () => {
    const links = [link('a'), link('b'), link('c')]
    const snapshot = JSON.stringify(links)
    expect(reorderLinksByStoredOrder([], ['a'])).toEqual([])
    reorderLinksByStoredOrder(links, ['c', 'a', 'b'])
    expect(JSON.stringify(links)).toBe(snapshot)
  })
})
