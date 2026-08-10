import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { CORPORATE_TEMPLATES } from '@/lib/templates/corporate-templates'
import { LANDING_TEMPLATES } from '@/lib/templates/landing-templates'

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
    // Rellena nombre y teléfono → se habilita
    const inputs = screen.getAllByPlaceholderText(/Nombre completo|Teléfono/)
    fireEvent.change(inputs[0] as Element, { target: { value: 'Ana Pérez' } })
    fireEvent.change(inputs[1] as Element, { target: { value: '51999999999' } })
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

  it('hero con primaryLink tipo ventana navega por onNavigateWindow en el editor', () => {
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
        onNavigateWindow={onNavigateWindow}
      />
    )
    const btn = screen.getByText('Ir a Ofertas').closest('a')
    fireEvent.click(btn as Element)
    expect(onNavigateWindow).toHaveBeenCalledWith('ofertas')
  })

  it('hero con secondaryLink tipo ancla mantiene el hash de ancla', () => {
    renderTemplate({ name: 'Test', blocks: typeBlocks.heroLinks, settings: {}, seo: {} }, { hash: '#/' })
    const secondary = screen.getByText('Ver más').closest('a')
    expect(secondary?.getAttribute('href')).toBe('#productos')
  })
})
