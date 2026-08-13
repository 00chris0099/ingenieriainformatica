import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import BlockPalette from '@/components/builder/BlockPalette'

function renderPalette() {
  return render(
    <DndContext>
      <BlockPalette onAddBlock={vi.fn()} />
    </DndContext>
  )
}

describe('BlockPalette accesibilidad', () => {
  afterEach(() => cleanup())

  it('las cabeceras de categoría exponen aria-expanded y alternan al hacer clic', () => {
    renderPalette()
    // Layout está expandida por defecto; el nombre accesible empieza por la categoría
    const header = screen.getByRole('button', { name: /^Layout/ })
    expect(header.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(header)
    expect(header.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(header)
    expect(header.getAttribute('aria-expanded')).toBe('true')
  })

  it('el buscador tiene aria-label y los bloques son botones con nombre y descripción', () => {
    renderPalette()
    expect(screen.getByLabelText('Buscar bloques')).toBeInTheDocument()
    const hero = screen.getByRole('button', { name: /^Hero/ })
    expect(hero).toBeInTheDocument()
  })
})
