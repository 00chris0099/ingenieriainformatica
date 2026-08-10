import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { BUILTIN_TEMPLATES } from '@/lib/builtinTemplates'
import { BLOCK_DND_MIME } from '@/lib/block-dnd'

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

describe('PublicStoreClient editor DnD (canvas drag & drop)', () => {
  const dndBlocks: any[] = [
    { id: 'dnd-nav', type: 'navbar', windowId: 'home', settings: {}, content: { links: [] } },
    {
      id: 'dnd-cols',
      type: 'columns',
      windowId: 'home',
      settings: { columns: '2' },
      content: {
        items: [
          { width: '50%', blocks: [{ id: 'dnd-nb-a', type: 'text', settings: {}, content: { text: 'Nested A' } }] },
          { width: '50%', blocks: [] },
        ],
      },
    },
    { id: 'dnd-hero', type: 'hero', windowId: 'home', settings: {}, content: { title: 'Hero Page' } },
    { id: 'dnd-footer', type: 'footer', windowId: 'home', settings: {}, content: {} },
  ]

  const makeDt = (seed: Record<string, string> = {}) => {
    const store = new Map<string, string>(Object.entries(seed))
    return {
      setData: (t: string, v: string) => { store.set(t, v) },
      getData: (t: string) => store.get(t) || '',
    }
  }

  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('nested blocks inside columns start a nested drag payload with their position', () => {
    renderEditor({ blocks: dndBlocks })
    const nbWrapper = screen.getByText('Nested A').closest('[data-block-id="dnd-nb-a"]') as Element
    const dt = makeDt()
    fireEvent.dragStart(nbWrapper, { dataTransfer: dt })
    expect(JSON.parse(dt.getData(BLOCK_DND_MIME) || 'null')).toEqual({
      kind: 'nested',
      blockId: 'dnd-nb-a',
      parentId: 'dnd-cols',
      colIdx: 0,
      nbIdx: 0,
    })
  })

  it('top-level blocks start a top drag payload', () => {
    renderEditor({ blocks: dndBlocks })
    const heroWrapper = screen.getByText('Hero Page').closest('[data-block-id="dnd-hero"]') as Element
    const dt = makeDt()
    fireEvent.dragStart(heroWrapper, { dataTransfer: dt })
    expect(JSON.parse(dt.getData(BLOCK_DND_MIME) || 'null')).toEqual({ kind: 'top', blockId: 'dnd-hero' })
  })

  it('dropping a top-level block on the columns container nests it (append to first column)', () => {
    const onCanvasBlockDrop = vi.fn()
    renderEditor({ blocks: dndBlocks, onCanvasBlockDrop })
    const colsWrapper = screen.getByText('Nested A').closest('[data-block-id="dnd-cols"]') as Element
    const dt = makeDt()
    dt.setData(BLOCK_DND_MIME, JSON.stringify({ kind: 'top', blockId: 'dnd-hero' }))
    fireEvent.drop(colsWrapper, { dataTransfer: dt })
    expect(onCanvasBlockDrop).toHaveBeenCalledTimes(1)
    expect(onCanvasBlockDrop).toHaveBeenCalledWith('dnd-cols', 0, undefined, { kind: 'top', blockId: 'dnd-hero' })
  })

  it('dropping on a nested block reports insert-before it without bubbling to the container', () => {
    const onCanvasBlockDrop = vi.fn()
    renderEditor({ blocks: dndBlocks, onCanvasBlockDrop })
    const nbWrapper = screen.getByText('Nested A').closest('[data-block-id="dnd-nb-a"]') as Element
    const dt = makeDt()
    dt.setData(BLOCK_DND_MIME, JSON.stringify({ kind: 'top', blockId: 'dnd-hero' }))
    fireEvent.drop(nbWrapper, { dataTransfer: dt })
    expect(onCanvasBlockDrop).toHaveBeenCalledTimes(1)
    expect(onCanvasBlockDrop).toHaveBeenCalledWith('dnd-cols', 0, 'dnd-nb-a', { kind: 'top', blockId: 'dnd-hero' })
  })

  it('non-columns blocks are not drop targets', () => {
    const onCanvasBlockDrop = vi.fn()
    renderEditor({ blocks: dndBlocks, onCanvasBlockDrop })
    const heroWrapper = screen.getByText('Hero Page').closest('[data-block-id="dnd-hero"]') as Element
    const dt = makeDt()
    dt.setData(BLOCK_DND_MIME, JSON.stringify({ kind: 'top', blockId: 'dnd-hero' }))
    fireEvent.drop(heroWrapper, { dataTransfer: dt })
    expect(onCanvasBlockDrop).not.toHaveBeenCalled()
  })

  it('forwards nested payloads to the builder (which guards cross-columns moves)', () => {
    const onCanvasBlockDrop = vi.fn()
    renderEditor({ blocks: dndBlocks, onCanvasBlockDrop })
    const nbWrapper = screen.getByText('Nested A').closest('[data-block-id="dnd-nb-a"]') as Element
    const dt = makeDt()
    dt.setData(BLOCK_DND_MIME, JSON.stringify({ kind: 'nested', blockId: 'x', parentId: 'otro-cols', colIdx: 0, nbIdx: 0 }))
    fireEvent.drop(nbWrapper, { dataTransfer: dt })
    expect(onCanvasBlockDrop).toHaveBeenCalledTimes(1)
    expect(onCanvasBlockDrop).toHaveBeenCalledWith('dnd-cols', 0, 'dnd-nb-a', { kind: 'nested', blockId: 'x', parentId: 'otro-cols', colIdx: 0, nbIdx: 0 })
  })
})
