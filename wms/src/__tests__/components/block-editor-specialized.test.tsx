import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import BlockEditor from '@/components/builder/BlockEditor'
import { blockRegistry } from '@repo/blocks'
import type { Block } from '@repo/blocks'
import type { ComponentProps } from 'react'
import { BLOCK_DND_MIME } from '@/lib/block-dnd'

const columnsBlock: Block = {
  id: 'block-cols-test',
  type: 'columns',
  settings: { columns: '2', gap: '32px', verticalAlign: 'top' },
  content: {
    items: [
      { width: '50%', blocks: [{ id: 'n1', type: 'text', settings: {}, content: { title: 'Nested Title', text: 'Nested body' } }] },
      { width: '50%', blocks: [] },
    ],
  },
}

const imageBlock: Block = {
  id: 'block-img-test',
  type: 'image',
  settings: { variant: 'caption', width: '75%' },
  content: { src: 'https://example.com/a.jpg', alt: 'Foto de ejemplo', caption: 'Pie de foto', link: '' },
}

const textBlock: Block = {
  id: 'block-text-test',
  type: 'text',
  settings: { variant: 'heading-text', textAlign: 'center' },
  content: { title: 'Mi Título', text: 'Cuerpo con **negrita**' },
}

function renderEditor(block: Block, onChange = vi.fn(), extra: Partial<ComponentProps<typeof BlockEditor>> = {}) {
  return render(
    <BlockEditor
      block={block}
      blockConfig={blockRegistry.get(block.type as any)}
      windows={['home']}
      onChange={onChange}
      onWindowChange={() => {}}
      onDuplicate={() => {}}
      onDelete={() => {}}
      {...extra}
    />
  )
}

/**
 * Localiza el <select> del campo cuyo <label> contiene exactamente el texto dado.
 * Robusto frente a la adición de nuevos controles: no depende de índices posicionales.
 */
function getSelectByLabel(labelText: string): HTMLSelectElement {
  const label = screen.getByText(labelText, { selector: 'label' }) as HTMLLabelElement
  const fieldDiv = label.parentElement as HTMLElement
  const select = fieldDiv.querySelector('select')
  if (!select) throw new Error(`No <select> encontrado para el label "${labelText}"`)
  return select as HTMLSelectElement
}

describe('BlockEditor editores especializados (columns / image / text)', () => {
  beforeEach(() => window.localStorage.clear())

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('columns muestra el gestor de columnas con los bloques anidados', () => {
    renderEditor(columnsBlock)
    expect(screen.getByText(/Columna 1 · 50%/)).toBeInTheDocument()
    expect(screen.getByText(/Columna 2 · 50%/)).toBeInTheDocument()
    expect(screen.getByText('text')).toBeInTheDocument() // bloque anidado
    expect(screen.getAllByText('+ Añadir bloque a esta columna…')).toHaveLength(2)
  })

  it('columns añade un bloque anidado a la columna vacía y notifica el cambio', () => {
    const onChange = vi.fn()
    renderEditor(columnsBlock, onChange)
    // Palette de la columna 2, localizada por su aria-label único por columna
    const col2Select = screen.getByRole('combobox', { name: 'Añadir bloque a la columna 2' }) as HTMLSelectElement
    fireEvent.change(col2Select, { target: { value: 'hero' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const nextContent = onChange.mock.calls[0]?.[1] as any
    expect(nextContent.items[0].blocks).toHaveLength(1) // col 1 intacta
    expect(nextContent.items[1].blocks).toHaveLength(1) // col 2 con el nuevo hero
    expect(nextContent.items[1].blocks[0].type).toBe('hero')
  })

  it('columns elimina un bloque anidado', () => {
    const onChange = vi.fn()
    renderEditor(columnsBlock, onChange)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar text' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const nextContent = onChange.mock.calls[0]?.[1] as any
    expect(nextContent.items[0].blocks).toHaveLength(0)
  })

  it('columns reordena un bloque anidado hacia abajo', () => {
    const onChange = vi.fn()
    const twoNested: Block = {
      ...columnsBlock,
      content: {
        items: [
          {
            width: '50%',
            blocks: [
              { id: 'a', type: 'text', settings: {}, content: { text: 'A' } },
              { id: 'b', type: 'image', settings: {}, content: { src: 'x' } },
            ],
          },
          { width: '50%', blocks: [] },
        ],
      },
    }
    renderEditor(twoNested, onChange)
    // El bloque anidado 'a' es de tipo text → su botón Bajar se localiza por aria-label
    fireEvent.click(screen.getByRole('button', { name: 'Bajar text' })) // mueve el primer bloque anidado hacia abajo
    expect(onChange).toHaveBeenCalledTimes(1)
    const nextContent = onChange.mock.calls[0]?.[1] as any
    expect(nextContent.items[0].blocks[0].type).toBe('image')
    expect(nextContent.items[0].blocks[1].type).toBe('text')
  })

  it('columns expone la configuración específica en Estilos y cambia el número de columnas', () => {
    const onChange = vi.fn()
    renderEditor(columnsBlock, onChange)
    fireEvent.click(screen.getByRole('button', { name: /Estilos/ }))
    expect(screen.getByText('Configuración específica del bloque')).toBeInTheDocument()
    expect(screen.getByText('Número de columnas')).toBeInTheDocument()
    expect(screen.getByText('Separación entre columnas (gap)')).toBeInTheDocument()
    const colSelect = getSelectByLabel('Número de columnas')
    expect(colSelect.value).toBe('2')
    fireEvent.change(colSelect, { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const newSettings = onChange.mock.calls[0]?.[0] as any
    expect(newSettings.columns).toBe('3')
  })

  it('image muestra subida desde dispositivo y campos alt/caption/link', () => {
    renderEditor(imageBlock)
    expect(screen.getByText('Subir')).toBeInTheDocument()
    expect(screen.getByText('Texto alternativo (alt)')).toBeInTheDocument()
    expect(screen.getByText('Pie de foto (caption)')).toBeInTheDocument()
    expect(screen.getByText('Enlace (link)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Foto de ejemplo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pie de foto')).toBeInTheDocument()
  })

  it('image expone variante/ancho/ajuste/esquinas en Estilos', () => {
    renderEditor(imageBlock)
    fireEvent.click(screen.getByRole('button', { name: /Estilos/ }))
    expect(getSelectByLabel('Variante').value).toBe('caption')
    expect(getSelectByLabel('Ancho').value).toBe('75%')
  })

  it('text muestra título y contenido con hint de markdown', () => {
    renderEditor(textBlock)
    expect(screen.getByText('Título (según variante)')).toBeInTheDocument()
    expect(screen.getAllByText('Contenido').length).toBeGreaterThanOrEqual(1) // pestaña + campo
    expect(screen.getByDisplayValue('Mi Título')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cuerpo con **negrita**')).toBeInTheDocument()
  })

  it('text expone variante/alineación/ancho máximo en Estilos', () => {
    renderEditor(textBlock)
    fireEvent.click(screen.getByRole('button', { name: /Estilos/ }))
    expect(screen.getByText('Variante')).toBeInTheDocument()
    expect(screen.getByText('Alineación')).toBeInTheDocument()
    expect(screen.getByText('Ancho máximo')).toBeInTheDocument()
    expect(getSelectByLabel('Variante').value).toBe('heading-text')
  })

  it('presets de degradado aplican toggle + paradas + dirección con un clic', () => {
    const onChange = vi.fn()
    renderEditor(textBlock, onChange)
    fireEvent.click(screen.getByRole('button', { name: /Estilos/ }))
    expect(screen.getByText('Presets')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Océano'))
    // El mock no re-renderiza el padre entre llamadas, así que cada onChange parte del
    // settings original; fusionar las llamadas equivale al estado acumulado del padre real.
    const finalSettings = onChange.mock.calls.reduce((acc: any, c: any) => ({ ...acc, ...(c[0] as any) }), {})
    expect(finalSettings.bgGradient).toBe(true)
    expect(finalSettings.bgGradientFrom).toBe('#06b6d4')
    expect(finalSettings.bgGradientTo).toBe('#2563eb')
    expect(finalSettings.bgGradientDirection).toBe('to right')
  })
})

describe('BlockEditor columns drag & drop (anidados ↔ columnas ↔ página)', () => {
  const dndCols: Block = {
    id: 'block-cols-dnd',
    type: 'columns',
    settings: { columns: '2' },
    content: {
      items: [
        { width: '50%', blocks: [{ id: 'dnd-a', type: 'text', settings: {}, content: { text: 'A' } }] },
        { width: '50%', blocks: [{ id: 'dnd-b', type: 'image', settings: {}, content: { src: 'x' } }] },
      ],
    },
  }

  const dropPayload = (kind: 'nested' | 'top', extra: Record<string, unknown>) => ({
    getData: (t: string) => (t === BLOCK_DND_MIME ? JSON.stringify({ kind, ...extra }) : ''),
  })

  beforeEach(() => window.localStorage.clear())

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('mueve un bloque anidado a la otra columna (soltar en la zona de añadir al final)', () => {
    const onChange = vi.fn()
    renderEditor(dndCols, onChange)
    // Zona de soltar de la columna 2, localizada dentro de su contenedor (aria-label "Columna 2")
    const col2Zone = within(screen.getByLabelText('Columna 2')).getByText('⇩ Soltar aquí (añadir al final)')
    fireEvent.drop(col2Zone, {
      dataTransfer: dropPayload('nested', { blockId: 'dnd-a', parentId: 'block-cols-dnd', colIdx: 0, nbIdx: 0 }),
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0]?.[1] as any
    expect(next.items[0].blocks).toHaveLength(0)
    expect(next.items[1].blocks.map((b: any) => b.id)).toEqual(['dnd-b', 'dnd-a'])
  })

  it('inserta un bloque anidado antes de la fila objetivo de la otra columna', () => {
    const onChange = vi.fn()
    renderEditor(dndCols, onChange)
    fireEvent.drop(screen.getByText('image'), {
      dataTransfer: dropPayload('nested', { blockId: 'dnd-a', parentId: 'block-cols-dnd', colIdx: 0, nbIdx: 0 }),
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0]?.[1] as any
    expect(next.items[1].blocks.map((b: any) => b.id)).toEqual(['dnd-a', 'dnd-b'])
  })

  it('ignora bloques anidados de otro bloque columns (parentId distinto)', () => {
    const onChange = vi.fn()
    renderEditor(dndCols, onChange)
    fireEvent.drop(screen.getByText('image'), {
      dataTransfer: dropPayload('nested', { blockId: 'x', parentId: 'otro-columns', colIdx: 0, nbIdx: 0 }),
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('demota un bloque de la página a la columna (append) y avisa al builder', () => {
    const onDemote = vi.fn()
    renderEditor(dndCols, vi.fn(), { onDemoteBlock: onDemote })
    const col2Zone = within(screen.getByLabelText('Columna 2')).getByText('⇩ Soltar aquí (añadir al final)')
    fireEvent.drop(col2Zone, { dataTransfer: dropPayload('top', { blockId: 'hero-page' }) })
    expect(onDemote).toHaveBeenCalledWith('hero-page', 'block-cols-dnd', 1, undefined)
  })

  it('demota un bloque de la página antes de una fila anidada existente', () => {
    const onDemote = vi.fn()
    renderEditor(dndCols, vi.fn(), { onDemoteBlock: onDemote })
    fireEvent.drop(screen.getByText('image'), { dataTransfer: dropPayload('top', { blockId: 'hero-page' }) })
    expect(onDemote).toHaveBeenCalledWith('hero-page', 'block-cols-dnd', 1, 'dnd-b')
  })
})

describe('BlockEditor deep-select (focusField del canvas)', () => {
  const heroBlock: Block = {
    id: 'block-hero-focus',
    type: 'hero',
    settings: { backgroundColor: '#0f172a' },
    content: { badge: 'NUEVA COLECCIÓN', title: 'Título Hero', subtitle: 'Bajada', buttonText: 'Ver Catálogo', secondaryButtonText: 'Explorar' },
  }

  const gridBlock: Block = {
    id: 'block-grid-focus',
    type: 'product-grid',
    settings: {},
    content: {
      title: 'Catálogo',
      products: [
        { id: 'p1', name: 'Primero', price: 'S/ 10', imageUrl: 'https://a.com/1.jpg' },
        { id: 'p2', name: 'Segundo', price: 'S/ 20', imageUrl: 'https://a.com/2.jpg' },
        { id: 'p3', name: 'Tercero', price: 'S/ 30', imageUrl: 'https://a.com/3.jpg' },
      ],
    },
  }

  beforeEach(() => window.localStorage.clear())

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('focusField=buttonText enfoca el input del botón principal y lo resalta', () => {
    renderEditor(heroBlock, vi.fn(), { focusField: 'buttonText' })
    const input = screen.getByPlaceholderText('Ver Catálogo') as HTMLInputElement
    expect(input).toBe(document.activeElement)
    // El wrapper del campo (label.parentElement) lleva el resaltado pulsante
    expect(input.closest('div')?.className).toContain('editor-field-focus')
  })

  it('focusField=title en hero enfoca el título principal', () => {
    renderEditor(heroBlock, vi.fn(), { focusField: 'title' })
    const input = screen.getByPlaceholderText('Moda & Tendencias') as HTMLInputElement
    expect(input).toBe(document.activeElement)
  })

  it('focusField=products:1:name expande la sección y enfoca el nombre del producto 2', () => {
    // Estado persistido: sección Productos colapsada y tarjeta 2 colapsada — el foco debe reabrir ambas
    window.localStorage.setItem('builder:block-editor:block-grid-focus', JSON.stringify({ tab: 'content', collapsed: ['products'], collapsedItems: ['products:1'] }))
    renderEditor(gridBlock, vi.fn(), { focusField: 'products:1:name' })
    // Los 3 productos están renderizados (verificación de expansión completa)
    expect(screen.getAllByPlaceholderText('Nombre del producto')).toHaveLength(3)
    // El producto 2 se localiza por su valor ('Segundo'), no por posición
    const second = screen.getByDisplayValue('Segundo') as HTMLInputElement
    expect(second).toBe(document.activeElement)
    // La tarjeta 2 quedó re-expandida (su nombre es editable y visible)
    expect(second.closest('div')?.className).toContain('editor-field-focus')
  })

  it('focusField=images:2 en gallery enfoca la tercera URL de imagen', () => {
    const galleryBlock: Block = {
      id: 'block-gallery-focus',
      type: 'gallery',
      settings: {},
      content: { title: 'Galería', images: ['https://a.com/1.jpg', 'https://a.com/2.jpg', 'https://a.com/3.jpg'] },
    }
    renderEditor(galleryBlock, vi.fn(), { focusField: 'images:2' })
    expect(screen.getAllByPlaceholderText('https://.../imagen.jpg')).toHaveLength(3)
    // La tercera URL se localiza por su valor, no por posición
    const third = screen.getByDisplayValue('https://a.com/3.jpg') as HTMLInputElement
    expect(third).toBe(document.activeElement)
  })
})
