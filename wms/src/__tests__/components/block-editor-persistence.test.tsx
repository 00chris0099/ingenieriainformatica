import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import BlockEditor from '@/components/builder/BlockEditor'
import { blockRegistry } from '@repo/blocks'
import type { Block } from '@repo/blocks'

const heroBlock: Block = {
  id: 'block-hero-test',
  type: 'hero',
  settings: {},
  content: { title: 'Moda Feliz', badge: 'NUEVA COLECCIÓN' },
}

const gridBlock: Block = {
  id: 'block-grid-test',
  type: 'product-grid',
  settings: {},
  content: {
    title: 'Catálogo',
    products: [{ id: 'p1', name: 'Producto A', price: 'S/ 10' }],
  },
}

function renderEditor(block: Block) {
  return render(
    <BlockEditor
      block={block}
      blockConfig={blockRegistry.get(block.type as any)}
      windows={['home']}
      onChange={() => {}}
      onWindowChange={() => {}}
      onDuplicate={() => {}}
      onDelete={() => {}}
    />
  )
}

describe('BlockEditor persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('persists the active tab per block across remounts', () => {
    const first = renderEditor(heroBlock)
    // Content tab is the default
    expect(screen.getByText('Título Principal')).toBeInTheDocument()
    expect(screen.queryByText('Color de Fondo')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Estilos'))
    expect(screen.getByText('Color de Fondo')).toBeInTheDocument()
    expect(screen.queryByText('Título Principal')).not.toBeInTheDocument()

    first.unmount()

    // Remounting the same block id restores the style tab
    renderEditor(heroBlock)
    expect(screen.getByText('Color de Fondo')).toBeInTheDocument()
    expect(screen.queryByText('Título Principal')).not.toBeInTheDocument()
  })

  it('persists collapsed list sections across remounts', () => {
    const first = renderEditor(gridBlock)
    // Products section is expanded by default
    expect(screen.getByText('Producto 1')).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Productos \(1\)/i))
    expect(screen.queryByText('Producto 1')).not.toBeInTheDocument()

    first.unmount()

    // Remounting the same block id keeps the section collapsed
    renderEditor(gridBlock)
    expect(screen.queryByText('Producto 1')).not.toBeInTheDocument()
  })

  it('restores defaults for blocks without a stored state', () => {
    renderEditor(gridBlock)
    // Fresh block: section expanded, content tab active
    expect(screen.getByText('Producto 1')).toBeInTheDocument()
    expect(screen.getByText('Título del Catálogo')).toBeInTheDocument()
  })
})
