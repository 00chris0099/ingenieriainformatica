import { describe, it, expect } from 'vitest'
import { neighborBlockEl } from '@/lib/block-list-nav'

function fixture() {
  const container = document.createElement('div')
  container.innerHTML = `
    <div data-block-id="a"></div>
    <div data-block-id="b"></div>
    <div data-block-id="c"></div>
  `
  const byId = (id: string) => container.querySelector(`[data-block-id="${id}"]`) as HTMLElement
  return { container, byId }
}

describe('neighborBlockEl (navegación ↑/↓ de la lista de bloques)', () => {
  it('devuelve el bloque siguiente y el anterior dentro de la lista', () => {
    const { container, byId } = fixture()
    expect(neighborBlockEl(container, byId('a'), 1)?.dataset.blockId).toBe('b')
    expect(neighborBlockEl(container, byId('b'), -1)?.dataset.blockId).toBe('a')
  })

  it('envuelve: desde el primero hacia arriba salta al último y viceversa', () => {
    const { container, byId } = fixture()
    expect(neighborBlockEl(container, byId('a'), -1)?.dataset.blockId).toBe('c')
    expect(neighborBlockEl(container, byId('c'), 1)?.dataset.blockId).toBe('a')
  })

  it('ignora bloques fuera del contenedor (p. ej. los del canvas)', () => {
    const { container, byId } = fixture()
    document.body.innerHTML = '<div data-block-id="canvas-block"></div>'
    // El bloque del canvas no está dentro de la lista: no afecta al vecino
    expect(neighborBlockEl(container, byId('a'), -1)?.dataset.blockId).toBe('c')
    document.body.innerHTML = ''
  })

  it('devuelve null cuando el elemento no está en la lista o la lista está vacía', () => {
    const { container } = fixture()
    expect(neighborBlockEl(container, document.createElement('div'), 1)).toBeNull()
    expect(neighborBlockEl(null, document.createElement('div'), 1)).toBeNull()
    const empty = document.createElement('div')
    expect(neighborBlockEl(empty, document.createElement('div'), -1)).toBeNull()
  })
})
