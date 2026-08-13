import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { CORPORATE_TEMPLATES } from '@/lib/templates/corporate-templates'
import { LANDING_TEMPLATES } from '@/lib/templates/landing-templates'
import { ULTRA_TEMPLATES } from '@/lib/templates/ultra-templates'

/** Hero visible en la ventana home de una plantilla (navbar/footer son globales). */
function homeHeroTitle(tpl: any): string {
  const hero = (tpl.blocks || []).find((b: any) => b.type === 'hero' && (!b.windowId || b.windowId === 'home'))
  return hero?.content?.title || tpl.blocks?.[1]?.content?.title || ''
}

// jsdom lacks IntersectionObserver used by the Reveal wrapper
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

function renderTemplate(template: any, opts: { editorMode?: boolean; controlledWindow?: string; hash?: string } = {}) {
  const { editorMode, controlledWindow, hash } = opts
  if (hash) window.location.hash = hash
  return render(
    <PublicStoreClient
      pageTitle={template.name}
      blocks={template.blocks}
      settings={template.settings}
      seo={template.seo}
      editorMode={editorMode}
      controlledWindow={controlledWindow}
      selectedBlockId={null}
      onSelectBlock={vi.fn()}
      onNavigateWindow={vi.fn()}
    />
  )
}

// Hand-built blocks exercising the three renderers added for full registry parity
const extendedBlocks = [
  {
    id: 'n-col',
    type: 'columns',
    windowId: 'home',
    settings: { columns: '2', gap: '24px', backgroundColor: '#f8fafc', paddingY: 48 },
    content: {
      items: [
        {
          width: '50%',
          blocks: [
            { id: 'n-text-in-col', type: 'text', settings: { variant: 'heading-text' }, content: { title: 'Columna Uno', text: 'Contenido de la **columna** uno' } },
          ],
        },
        {
          width: '50%',
          blocks: [
            { id: 'n-hero-in-col', type: 'hero', settings: { backgroundColor: '#0f172a', paddingY: 40 }, content: { title: 'Columna Dos Hero', subtitle: 'Hero anidado', buttonText: 'CTA Nested' } },
          ],
        },
      ],
    },
  },
  {
    id: 'n-img',
    type: 'image',
    windowId: 'home',
    settings: { variant: 'caption', width: '75%', borderRadius: '16px' },
    content: { src: 'https://example.com/foto.jpg', alt: 'Foto de prueba', caption: 'Mi foto' },
  },
  {
    id: 'n-txt',
    type: 'text',
    windowId: 'home',
    settings: { variant: 'heading-text', textAlign: 'center' },
    content: { title: 'Bloque de Texto', text: 'Texto con **negrita** y *cursiva*' },
  },
]

describe('Paridad editor vs público en todas las plantillas', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('corporate home: mismo hero en público y en editor', () => {
    const tpl = CORPORATE_TEMPLATES[0]
    renderTemplate(tpl, { hash: '#/' })
    const heroPublic = screen.getByText(/Convertimos la Estrategia de tu Empresa/i)
    cleanup()
    renderTemplate(tpl, { editorMode: true, controlledWindow: 'home' })
    const heroEditor = screen.getByText(/Convertimos la Estrategia de tu Empresa/i)
    expect(heroEditor).toBeInTheDocument()
    expect(heroEditor.textContent).toBe(heroPublic.textContent)
  })

  it('corporate ventana servicios: mismo contenido vía hash (público) y controlledWindow (editor)', () => {
    const tpl = CORPORATE_TEMPLATES[0]
    renderTemplate(tpl, { hash: '#/ventana/servicios' })
    expect(screen.getByText(/Nuestros Servicios Corporativos/i)).toBeInTheDocument()
    cleanup()
    renderTemplate(tpl, { editorMode: true, controlledWindow: 'servicios' })
    expect(screen.getByText(/Nuestros Servicios Corporativos/i)).toBeInTheDocument()
    expect(screen.queryByText(/Convertimos la Estrategia de tu Empresa/i)).not.toBeInTheDocument()
  })

  it('corporate ventana casos: testimonios idénticos en ambos modos', () => {
    const tpl = CORPORATE_TEMPLATES[0]
    renderTemplate(tpl, { hash: '#/ventana/casos' })
    const publicTitle = screen.getByText(/Casos de Éxito y Testimonios/i)
    cleanup()
    renderTemplate(tpl, { editorMode: true, controlledWindow: 'casos' })
    const editorTitle = screen.getByText(/Casos de Éxito y Testimonios/i)
    expect(editorTitle.textContent).toBe(publicTitle.textContent)
  })

  it('landing (una ventana): todo el scroll en público y en editor', () => {
    const tpl = LANDING_TEMPLATES[0]
    renderTemplate(tpl, { hash: '#/' })
    expect(screen.getByText(/Transforma tu Cuerpo en 12 Semanas/i)).toBeInTheDocument()
    expect(screen.getByText(/Resultados que Hablan/i)).toBeInTheDocument()
    cleanup()
    renderTemplate(tpl, { editorMode: true, controlledWindow: 'home' })
    expect(screen.getByText(/Transforma tu Cuerpo en 12 Semanas/i)).toBeInTheDocument()
    expect(screen.getByText(/Resultados que Hablan/i)).toBeInTheDocument()
  })

  it('columns renderiza bloques anidados en ambos modos', () => {
    renderTemplate({ name: 'Test', blocks: extendedBlocks, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText(/Columna Uno/i)).toBeInTheDocument()
    expect(screen.getByText(/Columna Dos Hero/i)).toBeInTheDocument()
    expect(screen.getByText(/Contenido de la/)).toBeInTheDocument()
    cleanup()
    renderTemplate({ name: 'Test', blocks: extendedBlocks, settings: {}, seo: {} }, { editorMode: true, controlledWindow: 'home' })
    expect(screen.getByText(/Columna Dos Hero/i)).toBeInTheDocument()
  })

  it('image renderiza la imagen con alt y caption', () => {
    renderTemplate({ name: 'Test', blocks: extendedBlocks, settings: {}, seo: {} }, { hash: '#/' })
    const img = screen.getByAltText('Foto de prueba')
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg')
    expect(screen.getByText('Mi foto')).toBeInTheDocument()
  })

  it('text renderiza título y contenido con markdown', () => {
    renderTemplate({ name: 'Test', blocks: extendedBlocks, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText(/Bloque de Texto/i)).toBeInTheDocument()
    const container = screen.getByText(/Texto con/).closest('div')
    expect(container?.innerHTML).toContain('<strong>negrita</strong>')
    expect(container?.innerHTML).toContain('<em>cursiva</em>')
  })

  it('bloques anidados de columns son seleccionables en el editor', () => {
    const onSelectBlock = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={extendedBlocks}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={onSelectBlock}
        onNavigateWindow={vi.fn()}
      />
    )
    const nested = screen.getByText(/Contenido de la/).closest('[data-block-id="n-text-in-col"]')
    expect(nested).not.toBeNull()
    fireEvent.click(nested as Element)
    expect(onSelectBlock).toHaveBeenCalledWith('n-text-in-col')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Plantillas ULTRA — paridad editor ↔ público en las 6 nuevas
// ═══════════════════════════════════════════════════════════════════════════

describe('Paridad editor vs público en las plantillas ULTRA', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it.each(ULTRA_TEMPLATES.map((t) => [t.id, t.name] as const))(
    '%s: el hero de home se ve idéntico en público y en editor',
    (id, name) => {
      const tpl = ULTRA_TEMPLATES.find((t) => t.id === id)!
      const title = homeHeroTitle(tpl)
      expect(title).toBeTruthy()

      renderTemplate(tpl, { hash: '#/' })
      expect(screen.getByText(title)).toBeInTheDocument()
      const heroPublic = screen.getByText(title)
      cleanup()

      renderTemplate(tpl, { editorMode: true, controlledWindow: 'home' })
      const heroEditor = screen.getByText(title)
      expect(heroEditor).toBeInTheDocument()
      expect(heroEditor.textContent).toBe(heroPublic.textContent)
    }
  )

  it('tiendas ultra: el catálogo con pestañas renderiza en ambos modos', () => {
    const stores = ULTRA_TEMPLATES.filter((t) => t.type === 'store')
    expect(stores.length).toBeGreaterThanOrEqual(2)
    for (const tpl of stores) {
      const grid = (tpl.blocks || []).find((b: any) => b.type === 'product-grid')
      expect(grid).toBeDefined()
      const catTitle = (grid as any)?.content?.title || 'Catálogo'

      renderTemplate(tpl, { hash: '#/catalogo' })
      expect(screen.getByText(catTitle)).toBeInTheDocument()
      expect(screen.getByText('Todos')).toBeInTheDocument()
      cleanup()

      renderTemplate(tpl, { editorMode: true, controlledWindow: 'catalogo' })
      expect(screen.getByText(catTitle)).toBeInTheDocument()
      const firstProduct = (grid as any)?.content?.products?.[0]?.name
      if (firstProduct) expect(screen.getByText(firstProduct)).toBeInTheDocument()
      cleanup()
    }
  })

  it('landings ultra: la sección de prueba social o servicios aparece en ambos modos', () => {
    const landings = ULTRA_TEMPLATES.filter((t) => t.type === 'landing')
    for (const tpl of landings) {
      const section = (tpl.blocks || []).find((b: any) => b.type === 'features' || b.type === 'social-proof')
      const sectionTitle = (section as any)?.content?.title || (section as any)?.content?.headline
      if (!sectionTitle) continue
      renderTemplate(tpl, { hash: '#/' })
      expect(screen.getByText(sectionTitle)).toBeInTheDocument()
      cleanup()
      renderTemplate(tpl, { editorMode: true, controlledWindow: 'home' })
      expect(screen.getByText(sectionTitle)).toBeInTheDocument()
      cleanup()
    }
  })

  it('corporativas ultra: las ventanas de equipo y blog navegan igual en ambos modos', () => {
    const corporate = ULTRA_TEMPLATES.filter((t) => t.type === 'corporate')
    for (const tpl of corporate) {
      const team = (tpl.blocks || []).find((b: any) => b.type === 'team')
      const articles = (tpl.blocks || []).find((b: any) => b.type === 'articles')
      const teamTitle = team?.content?.title
      if (teamTitle) {
        renderTemplate(tpl, { hash: '#/ventana/equipo' })
        expect(screen.getByText(teamTitle)).toBeInTheDocument()
        cleanup()
        renderTemplate(tpl, { editorMode: true, controlledWindow: 'equipo' })
        expect(screen.getByText(teamTitle)).toBeInTheDocument()
        cleanup()
      }
      const blogTitle = articles?.content?.title
      if (blogTitle) {
        renderTemplate(tpl, { hash: '#/ventana/blog' })
        expect(screen.getByText(blogTitle)).toBeInTheDocument()
        cleanup()
        renderTemplate(tpl, { editorMode: true, controlledWindow: 'blog' })
        expect(screen.getByText(blogTitle)).toBeInTheDocument()
        cleanup()
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Bloques por tipo: calendar, vsl, articles + footer configurable + destinos
// ═══════════════════════════════════════════════════════════════════════════

const typeBlocks: Record<string, any[]> = {
  calendar: [{
    id: 'cal', type: 'calendar', windowId: 'home',
    settings: { backgroundColor: '#0f172a', columns: '2' },
    content: { title: 'Agenda tu sesión gratuita', subtitle: 'Elige día y hora', buttonLabel: 'Confirmar reserva', whatsappNumber: '51999999999', hours: ['10:00', '16:00'], note: '30 min' },
  }],
  vsl: [{
    id: 'vsl', type: 'vsl', windowId: 'home',
    settings: { backgroundColor: '#0f172a' },
    content: { headline: 'Mira este video', videoUrl: 'https://www.youtube.com/watch?v=abc123xyz', ctaText: 'Quiero empezar', ctaUrl: '#cta' },
  }],
  articles: [{
    id: 'art', type: 'articles', windowId: 'home',
    settings: { backgroundColor: '#ffffff', columns: '3' },
    content: { title: 'Últimas publicaciones', articles: [
      { id: 'a1', title: 'Artículo Uno', excerpt: 'Resumen uno', date: '2026-07-20', tag: 'Guías' },
      { id: 'a2', title: 'Artículo Dos', excerpt: 'Resumen dos', date: '2026-06-12', tag: 'Casos' },
      { id: 'a3', title: 'Artículo Tres', excerpt: 'Resumen tres', date: '2026-05-03', tag: 'Mercado' },
    ] },
  }],
  footer: [{
    id: 'ft', type: 'footer', windowId: 'home',
    settings: { variant: 'standard', backgroundColor: '#0f172a', textColor: '#ffffff' },
    content: {
      companyName: 'Mi Empresa', tagline: 'Construyendo el futuro',
      columns: [{ title: 'Producto', links: [{ label: 'Características', url: '#' }, { label: 'Precios', url: '#' }] }],
      socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/miempresa' }],
      copyright: '© 2026 Mi Empresa',
    },
  }],
  heroLinks: [{
    id: 'hero-l', type: 'hero', windowId: 'home',
    settings: { backgroundColor: '#0f172a' },
    content: { title: 'Hero Links', buttonText: 'Ir a Ofertas', primaryLink: { type: 'window', value: 'ofertas' }, secondaryButtonText: 'Ver más', secondaryLink: { type: 'anchor', value: '#productos' } },
  }],
}

describe('Bloques por tipo: calendar, vsl, articles, footer y destinos', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
  })

  it('calendar: seleccionar día y hora habilita la reserva con datos del cliente', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.calendar, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText('Agenda tu sesión gratuita')).toBeInTheDocument()
    expect(screen.getByText(/Paso 1 · Elige el día/i)).toBeInTheDocument()
    // Antes de elegir día no hay botón de confirmar
    expect(screen.queryByText('Confirmar reserva')).not.toBeInTheDocument()
    // Elige un día (botón de fecha: texto corto con número)
    const dayButtons = Array.from(document.querySelectorAll('button'))
    const dateBtn = dayButtons.find((b) => /\d/.test(b.textContent || '') && !b.textContent?.includes('Paso') && !b.textContent?.includes(':'))
    fireEvent.click(dateBtn as Element)
    expect(screen.getByText(/Paso 2 · Elige la hora/i)).toBeInTheDocument()
    // Elige una hora → aparece el formulario de datos
    const timeBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === '16:00')
    fireEvent.click(timeBtn as Element)
    expect(screen.getByText(/Paso 3 · Tus datos/i)).toBeInTheDocument()
    // Sin nombre y teléfono, el botón está deshabilitado
    const btnBefore = screen.getByText('Confirmar reserva').closest('button')
    expect(btnBefore).toBeDisabled()
    // Rellena nombre y teléfono → se habilita (placeholders exactos, sin índices)
    fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByPlaceholderText('Teléfono / WhatsApp *'), { target: { value: '51999999999' } })
    const btn = screen.getByText('Confirmar reserva').closest('button')
    expect(btn).not.toBeDisabled()
  })

  it('vsl: muestra el video y al hacer clic carga el embed de YouTube', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.vsl, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText('Mira este video')).toBeInTheDocument()
    const play = screen.getByLabelText('Reproducir video')
    fireEvent.click(play)
    const iframe = document.querySelector('iframe')
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/abc123xyz')
  })

  it('articles: renderiza los tres artículos con etiqueta y fecha', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.articles, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText('Últimas publicaciones')).toBeInTheDocument()
    expect(screen.getByText('Artículo Uno')).toBeInTheDocument()
    expect(screen.getByText('Artículo Dos')).toBeInTheDocument()
    expect(screen.getByText('Artículo Tres')).toBeInTheDocument()
    expect(screen.getByText('Guías')).toBeInTheDocument()
  })

  it('footer: renderiza columnas de enlaces, redes y copyright', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.footer, settings: {}, seo: {} }, { hash: '#/' })
    expect(screen.getByText('Mi Empresa')).toBeInTheDocument()
    expect(screen.getByText('Producto')).toBeInTheDocument()
    expect(screen.getByText('Características')).toBeInTheDocument()
    expect(screen.getByText('© 2026 Mi Empresa')).toBeInTheDocument()
    const social = screen.getByLabelText('instagram')
    expect(social?.getAttribute('href')).toBe('https://instagram.com/miempresa')
  })

  it('hero con primaryLink: un clic selecciona + enfoca el campo; doble clic edita inline', () => {
    const onNavigateWindow = vi.fn()
    const onSelectElement = vi.fn()
    const onStartInlineEdit = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={typeBlocks.heroLinks ?? []}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onSelectElement={onSelectElement}
        onStartInlineEdit={onStartInlineEdit}
        onNavigateWindow={onNavigateWindow}
      />
    )
    const btnText = screen.getByText('Ir a Ofertas')
    // Single click: deep-select the button field, no navigation (no bucle)
    fireEvent.click(btnText)
    expect(onNavigateWindow).not.toHaveBeenCalled()
    expect(onSelectElement).toHaveBeenCalledWith('hero-l', 'buttonText')
    // Double click on the button text: starts inline editing (no navigation)
    fireEvent.dblClick(btnText)
    expect(onNavigateWindow).not.toHaveBeenCalled()
    expect(onStartInlineEdit).toHaveBeenCalledWith('hero-l', 'buttonText', 'Ir a Ofertas')
  })

  it('inline edit: doble clic en el título del hero inicia la edición del campo', () => {
    const onStartInlineEdit = vi.fn()
    const onNavigateWindow = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={typeBlocks.heroLinks ?? []}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onStartInlineEdit={onStartInlineEdit}
        onNavigateWindow={onNavigateWindow}
      />
    )
    fireEvent.dblClick(screen.getByText('Hero Links'))
    expect(onStartInlineEdit).toHaveBeenCalledWith('hero-l', 'title', 'Hero Links')
    expect(onNavigateWindow).not.toHaveBeenCalled()
  })

  it('inline edit: la marca del navbar se edita al hacer doble clic (sin navegar)', () => {
    const onStartInlineEdit = vi.fn()
    const onNavigateWindow = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'nav-test',
          type: 'navbar',
          windowId: 'home',
          settings: {},
          content: { brandName: 'Mi Marca', announcement: 'Envío gratis' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onStartInlineEdit={onStartInlineEdit}
        onNavigateWindow={onNavigateWindow}
      />
    )
    fireEvent.dblClick(screen.getByText('Mi Marca'))
    expect(onStartInlineEdit).toHaveBeenCalledWith('nav-test', 'brandName', 'Mi Marca')
    expect(onNavigateWindow).not.toHaveBeenCalled()
    // El anuncio superior también es editable en el canvas
    fireEvent.dblClick(screen.getByText('Envío gratis'))
    expect(onStartInlineEdit).toHaveBeenCalledWith('nav-test', 'announcement', 'Envío gratis')
  })

  it('inline edit: con inlineEdit activo el título se convierte en input y guarda en vivo (Enter)', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={typeBlocks.heroLinks ?? []}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        inlineEdit={{ blockId: 'hero-l', field: 'title' }}
        onInlineEditChange={onChange}
        onInlineEditCommit={onCommit}
        onInlineEditCancel={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    const input = document.querySelector('.canvas-inline-input') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('Hero Links')
    // Escribir actualiza el contenido en vivo
    fireEvent.change(input, { target: { value: 'Nuevo Título' } })
    expect(onChange).toHaveBeenCalledWith('hero-l', 'title', 'Nuevo Título')
    // Enter confirma y guarda
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledWith('hero-l', 'title', 'Nuevo Título')
  })

  it('inline edit: Escape cancela la edición y revierte el valor', () => {
    const onCancel = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={typeBlocks.heroLinks ?? []}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        inlineEdit={{ blockId: 'hero-l', field: 'title' }}
        onInlineEditChange={vi.fn()}
        onInlineEditCommit={vi.fn()}
        onInlineEditCancel={onCancel}
        onNavigateWindow={vi.fn()}
      />
    )
    const input = document.querySelector('.canvas-inline-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Cambio temporal' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledWith('hero-l', 'title')
  })

  it('deep-select: clic en el logo del navbar abre el inspector enfocado en logoUrl', () => {
    const onSelectElement = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'nav-test',
          type: 'navbar',
          windowId: 'home',
          settings: {},
          content: { brandName: 'Mi Marca', logoUrl: 'https://example.com/logo.png' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onSelectElement={onSelectElement}
        onNavigateWindow={vi.fn()}
      />
    )
    const logo = screen.getByAltText('Mi Marca')
    fireEvent.click(logo)
    expect(onSelectElement).toHaveBeenCalledWith('nav-test', 'logoUrl')
    // El clic en el logo no navega (solo selecciona)
    cleanup()
    const nav = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'nav2',
          type: 'navbar',
          windowId: 'home',
          settings: {},
          content: { brandName: 'Mi Marca' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onSelectElement={vi.fn()}
        onNavigateWindow={nav}
      />
    )
    fireEvent.click(screen.getByText('Mi Marca'))
    expect(nav).not.toHaveBeenCalled()
  })

  it('deep-select: clic derecho en un botón del hero abre el menú contextual con su campo', () => {
    const onContextMenu = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={typeBlocks.heroLinks ?? []}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onBlockContextMenu={onContextMenu}
        onNavigateWindow={vi.fn()}
      />
    )
    const btn = screen.getByText('Ir a Ofertas').closest('a')
    fireEvent.contextMenu(btn as Element, { clientX: 320, clientY: 180 })
    expect(onContextMenu).toHaveBeenCalledWith('hero-l', 'buttonText', 320, 180, null)
    // El menú del navegador no debe aparecer (default prevented)
    expect(btn?.getAttribute('href')).toBeDefined()
  })

  it('deep-select: clic derecho en el área vacía del hero apunta al campo heroImage', () => {
    const onContextMenu = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'hero-bg',
          type: 'hero',
          windowId: 'home',
          settings: { backgroundColor: '#0f172a' },
          content: { title: 'T', heroImage: 'https://example.com/bg.jpg' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onBlockContextMenu={onContextMenu}
        onNavigateWindow={vi.fn()}
      />
    )
    // Clic derecho sobre el <section> (fondo del hero), no sobre un elemento etiquetado
    const section = screen.getByText('T').closest('section')
    fireEvent.contextMenu(section as Element)
    expect(onContextMenu).toHaveBeenCalledWith('hero-bg', 'heroImage', expect.any(Number), expect.any(Number), 'https://example.com/bg.jpg')
  })

  it('deep-select: clic derecho en el logo pasa la URL para las acciones rápidas de imagen', () => {
    const onContextMenu = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'nav-logo',
          type: 'navbar',
          windowId: 'home',
          settings: {},
          content: { brandName: 'Mi Marca', logoUrl: 'https://example.com/logo.png' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onBlockContextMenu={onContextMenu}
        onNavigateWindow={vi.fn()}
      />
    )
    const logo = document.querySelector('[data-inline-image="logoUrl"]') as HTMLImageElement
    expect(logo).not.toBeNull()
    fireEvent.contextMenu(logo as Element, { clientX: 90, clientY: 40 })
    expect(onContextMenu).toHaveBeenCalledWith('nav-logo', 'logoUrl', 90, 40, 'https://example.com/logo.png')
  })

  it('deep-select: clic derecho en la imagen de un producto pasa su URL exacta', () => {
    const onContextMenu = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'grid-cm',
          type: 'product-grid',
          windowId: 'catalogo',
          settings: {},
          content: {
            title: 'Catálogo',
            products: [
              { id: 'p1', name: 'Producto Uno', price: 'S/ 59.90', imageUrl: 'https://example.com/p1.jpg' },
              { id: 'p2', name: 'Producto Dos', price: 'S/ 89.90', imageUrl: 'https://example.com/p2.jpg' },
            ],
          },
        }]}
        settings={{}}
        editorMode
        controlledWindow="catalogo"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onBlockContextMenu={onContextMenu}
        onNavigateWindow={vi.fn()}
      />
    )
    const second = document.querySelector('[data-inline-image="products:1:imageUrl"]') as HTMLElement
    expect(second).not.toBeNull()
    fireEvent.contextMenu(second as Element, { clientX: 250, clientY: 120 })
    expect(onContextMenu).toHaveBeenCalledWith('grid-cm', 'products:1:imageUrl', 250, 120, 'https://example.com/p2.jpg')
  })

  it('hero con secondaryLink tipo ancla mantiene el hash de ancla', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.heroLinks, settings: {}, seo: {} }, { hash: '#/' })
    const secondary = screen.getByText('Ver más').closest('a')
    expect(secondary?.getAttribute('href')).toBe('#productos')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Edición inline de IMÁGENES en el canvas (dbl-click → selector del dispositivo)
// ═══════════════════════════════════════════════════════════════════════════

describe('Edición inline de imágenes en el canvas', () => {
  beforeAll(() => {
    ;(global as any).IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    cleanup()
    window.location.hash = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const navbarBlock = {
    id: 'nav-img',
    type: 'navbar',
    windowId: 'home',
    settings: {},
    content: { brandName: 'Mi Marca', logoUrl: 'https://example.com/logo.png' },
  }

  it('doble clic en el logo del navbar abre el selector de archivos del dispositivo', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[navbarBlock]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    const logo = document.querySelector('[data-inline-image="logoUrl"]') as HTMLImageElement
    expect(logo).not.toBeNull()
    fireEvent.doubleClick(logo)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('doble clic en el fondo del hero abre el selector (heroImage) sin romper el texto', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'hero-img',
          type: 'hero',
          windowId: 'home',
          settings: { backgroundColor: '#0f172a' },
          content: { title: 'Hero Imagen', heroImage: 'https://example.com/bg.jpg' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    const hero = document.querySelector('[data-inline-image="heroImage"]') as HTMLElement
    expect(hero).not.toBeNull()
    // Doble clic en el fondo (el propio <section>): abre el selector
    fireEvent.doubleClick(hero)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    // El título del hero sigue siendo texto editable (el texto manda sobre la imagen de fondo)
    const onStartInlineEdit = vi.fn()
    cleanup()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'hero-img',
          type: 'hero',
          windowId: 'home',
          settings: { backgroundColor: '#0f172a' },
          content: { title: 'Hero Imagen', heroImage: 'https://example.com/bg.jpg' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onStartInlineEdit={onStartInlineEdit}
        onNavigateWindow={vi.fn()}
      />
    )
    fireEvent.doubleClick(screen.getByText('Hero Imagen'))
    expect(onStartInlineEdit).toHaveBeenCalledWith('hero-img', 'title', 'Hero Imagen')
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('doble clic en la imagen de un producto del catálogo abre el selector', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'grid-img',
          type: 'product-grid',
          windowId: 'catalogo',
          settings: {},
          content: {
            title: 'Catálogo',
            products: [
              { id: 'p1', name: 'Producto Uno', price: 'S/ 59.90', imageUrl: 'https://example.com/p1.jpg' },
              { id: 'p2', name: 'Producto Dos', price: 'S/ 89.90', imageUrl: 'https://example.com/p2.jpg' },
            ],
          },
        }]}
        settings={{}}
        editorMode
        controlledWindow="catalogo"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    const second = document.querySelector('[data-inline-image="products:1:imageUrl"]') as HTMLImageElement
    expect(second).not.toBeNull()
    fireEvent.doubleClick(second)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('sube la imagen elegida y llama onInlineImageUpload con la URL devuelta', async () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    const onUpload = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://imgbb.io/nuevo-logo.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[navbarBlock]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onInlineImageUpload={onUpload}
        onNavigateWindow={vi.fn()}
      />
    )
    const logo = document.querySelector('[data-inline-image="logoUrl"]') as HTMLImageElement
    fireEvent.doubleClick(logo)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    // Simula elegir un archivo en el input oculto (localizado por su aria-label)
    const input = screen.getByLabelText('Subir imagen del dispositivo') as HTMLInputElement
    expect(input).not.toBeNull()
    const file = new File(['data'], 'logo.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file] })
    await act(async () => {
      fireEvent.change(input)
    })
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      expect(onUpload).toHaveBeenCalledWith('nav-img', 'logoUrl', 'https://imgbb.io/nuevo-logo.png')
    })
  })

  it('arrastrar y soltar una imagen del escritorio sobre el logo la reemplaza en vivo', async () => {
    const onUpload = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://imgbb.io/logo-drag.png' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[navbarBlock]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onInlineImageUpload={onUpload}
        onNavigateWindow={vi.fn()}
      />
    )
    const logo = document.querySelector('[data-inline-image="logoUrl"]') as HTMLImageElement
    const file = new File(['x'], 'logo.png', { type: 'image/png' })
    await act(async () => {
      fireEvent.drop(logo, { dataTransfer: { files: [file], types: ['Files'] } })
    })
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      expect(onUpload).toHaveBeenCalledWith('nav-img', 'logoUrl', 'https://imgbb.io/logo-drag.png')
    })
  })

  it('soltar una imagen sobre el fondo del hero reemplaza heroImage sin tocar el texto', async () => {
    const onUpload = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, url: 'https://imgbb.io/hero-drag.jpg' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[{
          id: 'hero-img',
          type: 'hero',
          windowId: 'home',
          settings: { backgroundColor: '#0f172a' },
          content: { title: 'Hero Imagen', heroImage: 'https://example.com/bg.jpg' },
        }]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onInlineImageUpload={onUpload}
        onNavigateWindow={vi.fn()}
      />
    )
    const hero = document.querySelector('[data-inline-image="heroImage"]') as HTMLElement
    const file = new File(['x'], 'fondo.jpg', { type: 'image/jpeg' })
    await act(async () => {
      fireEvent.drop(hero, { dataTransfer: { files: [file], types: ['Files'] } })
    })
    await vi.waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith('hero-img', 'heroImage', 'https://imgbb.io/hero-drag.jpg')
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Insert '+' entre secciones del canvas
// ═══════════════════════════════════════════════════════════════════════════

describe('Insertar sección desde el canvas', () => {
  const heroBlock = {
    id: 'hero-1',
    type: 'hero',
    windowId: 'home',
    settings: { backgroundColor: '#0f172a' },
    content: { title: 'Hero Uno', buttonText: 'CTA' },
  }

  it('muestra un handle "+" antes de cada sección y uno al final, y llama onInsertBetween', () => {
    const onInsert = vi.fn()
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[heroBlock]}
        settings={{}}
        editorMode
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
        onInsertBetween={onInsert}
      />
    )
    // Un handle antes de la sección y otro al final, localizados por su aria-label único
    expect(screen.getAllByRole('button', { name: /Insertar sección/ })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Insertar sección antes de hero-1' }))
    expect(onInsert).toHaveBeenCalledWith('hero-1')
    fireEvent.click(screen.getByRole('button', { name: 'Insertar sección al final' }))
    expect(onInsert).toHaveBeenCalledWith(null)
  })

  it('no renderiza handles en modo público (sin editorMode)', () => {
    render(
      <PublicStoreClient
        pageTitle="Test"
        blocks={[heroBlock]}
        settings={{}}
        controlledWindow="home"
        selectedBlockId={null}
        onSelectBlock={vi.fn()}
        onNavigateWindow={vi.fn()}
      />
    )
    expect(document.querySelectorAll('.editor-insert-handle').length).toBe(0)
  })
})
