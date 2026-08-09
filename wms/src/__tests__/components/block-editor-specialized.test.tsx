import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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
    // [0] = selector de ventana, [1] = palette col 1, [2] = palette col 2
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    fireEvent.change(selects[2]!, { target: { value: 'hero' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const nextContent = onChange.mock.calls[0]?.[1] as any
    expect(nextContent.items[0].blocks).toHaveLength(1) // col 1 intacta
    expect(nextContent.items[1].blocks).toHaveLength(1) // col 2 con el nuevo hero
    expect(nextContent.items[1].blocks[0].type).toBe('hero')
  })

  it('columns elimina un bloque anidado', () => {
    const onChange = vi.fn()
    renderEditor(columnsBlock, onChange)
    fireEvent.click(screen.getByTitle('Quitar'))
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
    const bajars = screen.getAllByTitle('Bajar')
    fireEvent.click(bajars[0]!) // mueve el primer bloque anidado hacia abajo
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
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[] // [0] ventana, [1] columnas, [2] gap, [3] alineación
    expect(selects[1]?.value).toBe('2')
    fireEvent.change(selects[1]!, { target: { value: '3' } })
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
    expect(screen.getByText('Variante')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[] // [0] ventana, [1] variante, [2] ancho, [3] fit, [4] esquinas
    expect(selects[1]?.value).toBe('caption')
    expect(selects[2]?.value).toBe('75%')
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
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[] // [0] ventana, [1] variante, [2] alineación, [3] ancho máx
    expect(selects[1]?.value).toBe('heading-text')
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
    const zones = screen.getAllByText('⇩ Soltar aquí (añadir al final)')
    fireEvent.drop(zones[1]!, {
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
    const zones = screen.getAllByText('⇩ Soltar aquí (añadir al final)')
    fireEvent.drop(zones[1]!, { dataTransfer: dropPayload('top', { blockId: 'hero-page' }) })
    expect(onDemote).toHaveBeenCalledWith('hero-page', 'block-cols-dnd', 1, undefined)
  })

  it('demota un bloque de la página antes de una fila anidada existente', () => {
    const onDemote = vi.fn()
    renderEditor(dndCols, vi.fn(), { onDemoteBlock: onDemote })
    fireEvent.drop(screen.getByText('image'), { dataTransfer: dropPayload('top', { blockId: 'hero-page' }) })
    expect(onDemote).toHaveBeenCalledWith('hero-page', 'block-cols-dnd', 1, 'dnd-b')
  })
})
