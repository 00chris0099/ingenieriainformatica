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

  it('canvas blocks are keyboard-focusable and Enter selects the block', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    // El wrapper es un botón semántico para teclado y lectores de pantalla
    expect(hero.getAttribute('role')).toBe('button')
    expect(hero.getAttribute('tabindex')).toBe('0')
    expect(hero.getAttribute('aria-label')).toContain('hero')
    hero.focus()
    fireEvent.keyDown(hero, { key: 'Enter' })
    expect(onSelectBlock).toHaveBeenCalledTimes(1)
    // Espacio también selecciona
    fireEvent.keyDown(hero, { key: ' ' })
    expect(onSelectBlock).toHaveBeenCalledTimes(2)
  })

  it('canvas blocks ignore key events bubbled from interactive children', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    // Tecla lanzada desde un hijo (p. ej. el botón CTA): el wrapper no debe seleccionar
    fireEvent.keyDown(hero.firstElementChild as Element, { key: 'Enter' })
    expect(onSelectBlock).not.toHaveBeenCalled()
  })

  it('Shift+F10 en un bloque del canvas abre el menú contextual en su centro', () => {
    const onBlockContextMenu = vi.fn()
    renderEditor({ onBlockContextMenu })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    hero.focus()
    fireEvent.keyDown(hero, { key: 'F10', shiftKey: true })
    expect(onBlockContextMenu).toHaveBeenCalledTimes(1)
    const [blockId, field, x, y] = onBlockContextMenu.mock.calls[0] ?? []
    expect(blockId).toBe(hero.dataset.blockId)
    expect(field).toBeNull()
    expect(typeof x).toBe('number')
    expect(typeof y).toBe('number')
  })

  it('flechas ↑/↓ mueven el foco de sección en sección y sincronizan la selección', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const blocks = Array.from(document.querySelectorAll('[data-block-id].editor-block')) as HTMLElement[]
    expect(blocks.length).toBeGreaterThanOrEqual(2)
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    const heroIdx = blocks.indexOf(hero)
    hero.focus()
    const nextBlock = blocks[heroIdx + 1]!
    fireEvent.keyDown(hero, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(nextBlock)
    expect(onSelectBlock).toHaveBeenLastCalledWith(nextBlock.dataset.blockId)
    // Flecha arriba devuelve el foco al bloque anterior
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(hero)
    // Envolvente: ArrowUp en el primer bloque salta al último
    blocks[0]!.focus()
    fireEvent.keyDown(blocks[0]!, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(blocks[blocks.length - 1]!)
  })

  it('Home/End saltan a la primera y última sección del canvas', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const blocks = Array.from(document.querySelectorAll('[data-block-id].editor-block')) as HTMLElement[]
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    hero.focus()
    fireEvent.keyDown(hero, { key: 'End' })
    expect(document.activeElement).toBe(blocks[blocks.length - 1]!)
    expect(onSelectBlock).toHaveBeenLastCalledWith(blocks[blocks.length - 1]!.dataset.blockId)
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Home' })
    expect(document.activeElement).toBe(blocks[0]!)
    expect(onSelectBlock).toHaveBeenLastCalledWith(blocks[0]!.dataset.blockId)
  })

  it('F2 sobre una sección del canvas inicia la edición inline del primer campo editable', () => {
    const onStartInlineEdit = vi.fn()
    renderEditor({
      blocks: [{ id: 'h-f2', type: 'hero', windowId: 'home', settings: {}, content: { title: 'Título F2', buttonText: 'CTA' } }],
      onStartInlineEdit,
    })
    const hero = screen.getByText('Título F2').closest('[data-block-id]') as HTMLElement
    hero.focus()
    fireEvent.keyDown(hero, { key: 'F2' })
    expect(onStartInlineEdit).toHaveBeenCalledWith('h-f2', 'title', 'Título F2')
  })

  it('PageUp/PageDown desplazan el lienzo sin cambiar de sección', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    hero.focus()
    fireEvent.keyDown(hero, { key: 'PageDown' })
    fireEvent.keyDown(hero, { key: 'PageUp' })
    // El foco permanece en la misma sección y no se sincroniza selección
    expect(document.activeElement).toBe(hero)
    expect(onSelectBlock).not.toHaveBeenCalled()
  })

  it('las flechas del canvas no reordenan la sección (no llegan al handler global)', () => {
    const onSelectBlock = vi.fn()
    renderEditor({ onSelectBlock })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    hero.focus()
    // El stopPropagation evita que el builder la interprete como mover el bloque
    fireEvent.keyDown(hero, { key: 'ArrowDown' })
    expect(onSelectBlock).toHaveBeenCalledTimes(1) // solo la sincronización de selección
  })

  it('marca con aria-current la sección seleccionada del canvas para lectores de pantalla', () => {
    const heroBlock = storeTemplate.blocks.find((b: any) => b.type === 'hero')
    renderEditor({ selectedBlockId: heroBlock ? heroBlock.id : 'hero-fallback' })
    const hero = screen.getByText(/Moda Feliz y Exclusiva/i).closest('[data-block-id]') as HTMLElement
    expect(hero.getAttribute('aria-current')).toBe('true')
    expect(hero.getAttribute('aria-label')).toContain('(seleccionada)')
    // Las demás secciones visibles no llevan aria-current
    const others = Array.from(document.querySelectorAll('[data-block-id].editor-block')).filter(el => el !== hero) as HTMLElement[]
    expect(others.length).toBeGreaterThan(0)
    for (const other of others) expect(other.getAttribute('aria-current')).toBeNull()
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

  // ── Design / responsive settings (parity editor ↔ público) ─────────────
  const responsiveBlocks = [
    {
      id: 'resp-hero',
      type: 'hero',
      windowId: 'home',
      settings: { hideMobile: true, blockWidth: 'medium', backgroundColor: '#0f172a' },
      content: { title: 'Hero Responsive', subtitle: 'Se oculta en móvil', buttonText: 'CTA' },
    },
    {
      id: 'resp-text',
      type: 'text',
      windowId: 'home',
      settings: { hideTablet: true, blockWidth: 'narrow', variant: 'heading-text' },
      content: { title: 'Texto Solo Desktop', text: 'Contenido' },
    },
  ]

  it('applies responsive/width classes in editor mode (canvas)', () => {
    renderEditor({ blocks: responsiveBlocks })
    const hero = screen.getByText('Hero Responsive').closest('[data-block-id="resp-hero"]') as Element
    expect(hero.className).toContain('max-md:hidden')
    expect(hero.className).toContain('max-w-3xl')
    expect(hero.className).toContain('mx-auto')
    const text = screen.getByText('Texto Solo Desktop').closest('[data-block-id="resp-text"]') as Element
    expect(text.className).toContain('max-lg:hidden')
    expect(text.className).toContain('max-w-xl')
  })

  it('applies the exact same responsive/width classes in public mode (parity 100%)', () => {
    render(
      <PublicStoreClient
        pageTitle="Resp"
        blocks={responsiveBlocks}
        settings={{}}
        seo={undefined}
      />
    )
    const heroText = screen.getByText('Hero Responsive')
    const heroWrap = heroText.closest('.max-w-3xl') as Element
    expect(heroWrap.className).toContain('max-md:hidden')
    expect(heroWrap.className).toContain('mx-auto')
    const textWrap = screen.getByText('Texto Solo Desktop').closest('.max-w-xl') as Element
    expect(textWrap.className).toContain('max-lg:hidden')
    expect(textWrap.className).toContain('mx-auto')
  })

  it('default blocks keep pixel-identical DOM in public mode (no extra wrapper)', () => {
    renderEditor({ blocks: responsiveBlocks.map(b => ({ ...b, settings: {} })) })
    const hero = screen.getByText('Hero Responsive').closest('[data-block-id]') as HTMLElement
    expect(hero.className).not.toContain('max-w-')
    expect(hero.className).not.toContain('hidden')
    expect(hero.style.cssText).toBe('')
  })

  // ── Fine spacing / border radius (parity editor ↔ público) ─────────────
  const spacingBlocks = [
    {
      id: 'spacing-hero',
      type: 'hero',
      windowId: 'home',
      settings: { paddingTop: 40, paddingBottom: 80, paddingX: 24, borderRadius: '16px' },
      content: { title: 'Hero Espaciado', subtitle: 'Padding fino', buttonText: 'CTA' },
    },
  ]

  it('applies fine spacing styles on the canvas wrapper (editor mode)', () => {
    renderEditor({ blocks: spacingBlocks })
    const hero = screen.getByText('Hero Espaciado').closest('[data-block-id="spacing-hero"]') as HTMLElement
    expect(hero.style.paddingTop).toBe('40px')
    expect(hero.style.paddingBottom).toBe('80px')
    expect(hero.style.paddingLeft).toBe('24px')
    expect(hero.style.paddingRight).toBe('24px')
    expect(hero.style.borderRadius).toBe('16px')
  })

  it('applies the exact same spacing styles in public mode (parity 100%)', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Sp"
        blocks={spacingBlocks}
        settings={{}}
        seo={undefined}
      />
    )
    const wrap = Array.from(container.querySelectorAll<HTMLElement>('[style]')).find(el => el.style.paddingTop === '40px')
    expect(wrap).toBeTruthy()
    expect(wrap!.style.paddingBottom).toBe('80px')
    expect(wrap!.style.paddingLeft).toBe('24px')
    expect(wrap!.style.paddingRight).toBe('24px')
    expect(wrap!.style.borderRadius).toBe('16px')
  })

  it('spacing blocks without explicit values render with no wrapper style', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Sp"
        blocks={spacingBlocks.map(b => ({ ...b, settings: {} }))}
        settings={{}}
        seo={undefined}
      />
    )
    const all = Array.from(container.querySelectorAll<HTMLElement>('[style]'))
    expect(all.some(el => el.style.paddingTop === '40px')).toBe(false)
    expect(all.some(el => el.style.borderRadius !== '')).toBe(false)
  })

  // ── Superficie & borde universales (parity editor ↔ público) ───────────
  const surfaceBlocks = [
    {
      id: 'surface-hero',
      type: 'hero',
      windowId: 'home',
      settings: { bgColor: '#123456', bgOpacity: 50, borderColor: '#e2e8f0', borderWidth: 2, borderStyle: 'dashed', borderRadius: '12px' },
      content: { title: 'Hero Superficie', subtitle: 'Fondo translúcido con borde', buttonText: 'CTA' },
    },
  ]

  it('applies surface/border styles on the canvas wrapper (editor mode)', () => {
    renderEditor({ blocks: surfaceBlocks })
    const hero = screen.getByText('Hero Superficie').closest('[data-block-id="surface-hero"]') as HTMLElement
    expect(hero.style.backgroundColor).toBe('rgba(18, 52, 86, 0.5)')
    expect(hero.style.borderWidth).toBe('2px')
    expect(hero.style.borderStyle).toBe('dashed')
    expect(hero.style.borderColor).toBe('rgb(226, 232, 240)')
    expect(hero.style.borderRadius).toBe('12px')
  })

  it('applies the exact same surface/border styles in public mode (parity 100%)', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Sup"
        blocks={surfaceBlocks}
        settings={{}}
        seo={undefined}
      />
    )
    const wrap = Array.from(container.querySelectorAll<HTMLElement>('[style]')).find(el => el.style.backgroundColor === 'rgba(18, 52, 86, 0.5)')
    expect(wrap).toBeTruthy()
    expect(wrap!.style.borderWidth).toBe('2px')
    expect(wrap!.style.borderStyle).toBe('dashed')
    expect(wrap!.style.borderColor).toBe('rgb(226, 232, 240)')
    expect(wrap!.style.borderRadius).toBe('12px')
  })

  it('surface blocks without explicit values render with no bg/border styles', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Sup"
        blocks={surfaceBlocks.map(b => ({ ...b, settings: {} }))}
        settings={{}}
        seo={undefined}
      />
    )
    const all = Array.from(container.querySelectorAll<HTMLElement>('[style]'))
    expect(all.some(el => el.style.backgroundColor === 'rgba(18, 52, 86, 0.5)')).toBe(false)
    expect(all.some(el => el.style.borderWidth !== '')).toBe(false)
  })

  // ── Degradados de fondo (parity editor ↔ público) ───────────────────────
  const gradientBlocks = [
    {
      id: 'gradient-hero',
      type: 'hero',
      windowId: 'home',
      settings: { bgGradient: true, bgGradientFrom: '#ef4444', bgGradientTo: '#3b82f6', bgGradientDirection: 'to right', bgOpacity: 50 },
      content: { title: 'Hero Degradado', subtitle: 'Fondo con gradiente', buttonText: 'CTA' },
    },
  ]

  it('applies the gradient background on the canvas wrapper (editor mode)', () => {
    renderEditor({ blocks: gradientBlocks })
    const hero = screen.getByText('Hero Degradado').closest('[data-block-id="gradient-hero"]') as HTMLElement
    expect(hero.style.backgroundImage).toContain('linear-gradient')
    expect(hero.style.backgroundImage).toContain('to right')
    expect(hero.style.backgroundImage).toContain('rgba(239, 68, 68, 0.5)')
    expect(hero.style.backgroundImage).toContain('rgba(59, 130, 246, 0.5)')
  })

  it('applies the exact same gradient background in public mode (parity 100%)', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Grad"
        blocks={gradientBlocks}
        settings={{}}
        seo={undefined}
      />
    )
    const wrap = Array.from(container.querySelectorAll<HTMLElement>('[style]')).find(el => el.style.backgroundImage.includes('linear-gradient'))
    expect(wrap).toBeTruthy()
    expect(wrap!.style.backgroundImage).toContain('to right')
    expect(wrap!.style.backgroundImage).toContain('rgba(239, 68, 68, 0.5)')
    expect(wrap!.style.backgroundImage).toContain('rgba(59, 130, 246, 0.5)')
  })

  it('blocks with gradient disabled render with no gradient background', () => {
    const { container } = render(
      <PublicStoreClient
        pageTitle="Grad"
        blocks={gradientBlocks.map(b => ({ ...b, settings: { bgGradient: false, bgGradientFrom: '#ef4444', bgGradientTo: '#3b82f6' } }))}
        settings={{}}
        seo={undefined}
      />
    )
    const all = Array.from(container.querySelectorAll<HTMLElement>('[style]'))
    expect(all.some(el => el.style.backgroundImage.includes('linear-gradient'))).toBe(false)
  })
})
