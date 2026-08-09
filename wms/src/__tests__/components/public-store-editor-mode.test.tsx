import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

function renderEditor(overrides: Record<string, any> = {}) {
  return render(
    <PublicStoreClient
      pageTitle="Adrisu Kids"
      blocks={storeTemplate.blocks}
      settings={storeTemplate.settings}
      seo={storeTemplate.seo}
      editorMode
      controlledWindow="home"
      selectedBlockId={null}
      onSelectBlock={vi.fn()}
      onNavigateWindow={vi.fn()}
      {...overrides}
    />
  )
}

describe('PublicStoreClient editor mode (100% parity canvas)', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('renders the same window content as public mode (home)', () => {
    renderEditor()
    expect(screen.getByText(/Moda Feliz y Exclusiva/i)).toBeInTheDocument() // hero
    expect(screen.queryByText(/Catálogo de Moda Infantil/i)).not.toBeInTheDocument() // product-grid
  })

  it('is driven by controlledWindow, ignoring the URL hash', () => {
    window.location.hash = '#/ventana/ofertas' // must be ignored in editor mode
    renderEditor({ controlledWindow: 'home' })
    expect(screen.getByText(/Moda Feliz y Exclusiva/i)).toBeInTheDocument()
    expect(screen.queryByText(/Oferta Relámpago de Verano/i)).not.toBeInTheDocument()
  })

  it('switches the rendered window when controlledWindow changes', () => {
    const { rerender } = renderEditor()
    rerender(
      <PublicStoreClient
        pageTitle="Adrisu Kids"
        blocks={storeTemplate.blocks}
        settings={storeTemplate.settings}
        editorMode
        controlledWindow="catalogo"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    expect(screen.getByText(/Catálogo de Moda Infantil/i)).toBeInTheDocument()
    expect(screen.queryByText(/Moda Feliz y Exclusiva/i)).not.toBeInTheDocument()
  })

  it('wraps every block with a data-block-id and reports clicks to the builder', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]')
    expect(hero).not.toBeNull()
    fireEvent.click(hero as Element)
    expect(onSelectBlock).toHaveBeenCalledTimes(1)
    const blockId = onSelectBlock.mock.calls[0]?.[0]
    expect(typeof blockId).toBe('string')
  })

  it('marks the selected block with the editor-block-selected class', () => {
    const heroBlock = storeTemplate.blocks.find((b: any) => b.type === 'hero')
    renderEditor({ selectedBlockId: heroBlock ? heroBlock.id : 'hero-fallback' })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as Element
    expect(hero.className).toContain('editor-block-selected')
  })

  it('intercepts navbar navigation to the builder instead of changing the hash', () => {
    const onNavigateWindow = vi.fn()
    renderEditor({ controlledWindow: 'home', onNavigateWindow })
    fireEvent.click(screen.getByText('Ofertas Flash'))
    expect(onNavigateWindow).toHaveBeenCalledWith('ofertas')
    expect(window.location.hash).toBe('') // no hash routing happened
  })

  it('renders a product landing window through controlledWindow in editor mode', () => {
    renderEditor({ controlledWindow: 'product:p1' })
    expect(screen.getByText(/Conjunto Algodón Orgánico Dino Explorer/i)).toBeInTheDocument()
    expect(screen.getByText(/También te puede gustar/i)).toBeInTheDocument()
  })
})
