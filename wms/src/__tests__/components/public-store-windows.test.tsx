import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { BUILTIN_TEMPLATES } from '@/lib/builtinTemplates'

// jsdom lacks IntersectionObserver used by the Reveal wrapper
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

const storeTemplate = BUILTIN_TEMPLATES.find(t => t.id === 'tpl-adrisu-kids')!

function renderStore() {
  return render(
    <PublicStoreClient
      pageTitle="Adrisu Kids"
      blocks={storeTemplate.blocks}
      settings={storeTemplate.settings}
      seo={storeTemplate.seo}
    />
  )
}

describe('PublicStoreClient multi-window', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
  })

  it('home window shows hero but hides catalog and ofertas blocks', () => {
    window.location.hash = '#/'
    renderStore()
    expect(screen.getByText(/Moda Feliz y Exclusiva/i)).toBeInTheDocument() // hero
    expect(screen.queryByText(/Catálogo de Moda Infantil/i)).not.toBeInTheDocument() // product-grid
    expect(screen.queryByText(/Oferta Relámpago de Verano/i)).not.toBeInTheDocument() // countdown (ofertas)
    expect(screen.getAllByText(/ADRISU KIDS/i).length).toBeGreaterThan(0) // global navbar + footer
  })

  it('catalogo window shows product grid but hides hero', () => {
    window.location.hash = '#/catalogo'
    renderStore()
    expect(screen.getByText(/Catálogo de Moda Infantil/i)).toBeInTheDocument()
    expect(screen.queryByText(/Moda Feliz y Exclusiva/i)).not.toBeInTheDocument()
    // category tabs from the grid render
    expect(screen.getByText(/Colección Niñas/i)).toBeInTheDocument()
  })

  it('ofertas window shows countdown + CTA but hides hero', () => {
    window.location.hash = '#/ventana/ofertas'
    renderStore()
    expect(screen.getByText(/Oferta Relámpago de Verano/i)).toBeInTheDocument()
    expect(screen.getByText(/¡CUPÓN 15% OFF EXTRA/i)).toBeInTheDocument()
    expect(screen.queryByText(/Moda Feliz y Exclusiva/i)).not.toBeInTheDocument()
  })

  it('product window shows a full product landing with related products', () => {
    window.location.hash = '#/producto/p1'
    renderStore()
    expect(screen.getByText(/Conjunto Algodón Orgánico Dino Explorer/i)).toBeInTheDocument()
    expect(screen.getByText(/También te puede gustar/i)).toBeInTheDocument()
    // hero of home is not rendered
    expect(screen.queryByText(/Moda Feliz y Exclusiva/i)).not.toBeInTheDocument()
  })

  it('falls back to home for unknown/empty windows', () => {
    window.location.hash = '#/ventana/inexistente'
    renderStore()
    expect(screen.getByText(/Moda Feliz y Exclusiva/i)).toBeInTheDocument()
  })
})
