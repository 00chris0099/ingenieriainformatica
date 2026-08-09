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
