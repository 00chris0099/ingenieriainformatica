import { describe, it, expect } from 'vitest'
import { moveBlockTo } from '@/lib/block-order'
import type { Block } from '@repo/blocks'

function block(id: string, windowId?: string): Block {
  return { id, type: 'hero', settings: {}, content: {}, ...(windowId ? { windowId } : {}) } as Block
}

const blocks: Block[] = [
  block('home-hero', 'home'),
  block('home-features', 'home'),
  block('home-cta', 'home'),
  block('cat-grid', 'catalogo'),
  block('cat-countdown', 'catalogo'),
]

describe('moveBlockTo (drag & drop reorder)', () => {
  it('moves a block before its target within the same window', () => {
    // home-hero is dropped onto home-cta → it lands right before home-cta (one slot down)
    const result = moveBlockTo(blocks, 'home-hero', 'home-cta')
    expect(result?.map(b => b.id)).toEqual(['home-features', 'home-hero', 'home-cta', 'cat-grid', 'cat-countdown'])
  })

  it('moves a block upward before its target', () => {
    const result = moveBlockTo(blocks, 'home-cta', 'home-hero')
    expect(result?.map(b => b.id)).toEqual(['home-cta', 'home-hero', 'home-features', 'cat-grid', 'cat-countdown'])
  })

  it('returns null when dragging across windows', () => {
    expect(moveBlockTo(blocks, 'home-hero', 'cat-grid')).toBeNull()
  })

  it('returns null for unknown ids or the same block', () => {
    expect(moveBlockTo(blocks, 'nope', 'home-hero')).toBeNull()
    expect(moveBlockTo(blocks, 'home-hero', 'nope')).toBeNull()
    expect(moveBlockTo(blocks, 'home-hero', 'home-hero')).toBeNull()
  })

  it('does not mutate the input array', () => {
    const copy = [...blocks]
    moveBlockTo(blocks, 'home-hero', 'home-cta')
    expect(blocks.map(b => b.id)).toEqual(copy.map(b => b.id))
  })
})
