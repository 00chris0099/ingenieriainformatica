import { describe, it, expect } from 'vitest'
import { moveBlockTo, moveNestedBetweenColumns, promoteNestedBlock, demoteBlock, moveBlockToWindow, promoteNestedBlockToWindow, blockHasProductContent } from '@/lib/block-order'
import type { Block } from '@repo/blocks'

function block(id: string, windowId?: string): Block {
  return { id, type: 'hero', settings: {}, content: {}, ...(windowId ? { windowId } : {}) } as Block
}

function columnsBlock(id: string, items: any[], windowId = 'home'): Block {
  return { id, type: 'columns', windowId, settings: { columns: '2' }, content: { items } } as Block
}

const twoCols = [
  { width: '50%', blocks: [block('a'), block('b')] },
  { width: '50%', blocks: [block('c')] },
]

function colIds(items: any[], colIdx: number) {
  return (items[colIdx]?.blocks || []).map((b: Block) => b.id)
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

describe('moveNestedBetweenColumns (nested drag & drop)', () => {
  it('moves a nested block to another column (append)', () => {
    const next = moveNestedBetweenColumns(twoCols, 0, 0, 1)
    expect(colIds(next!, 0)).toEqual(['b'])
    expect(colIds(next!, 1)).toEqual(['c', 'a'])
  })

  it('inserts a nested block before a target in another column', () => {
    const next = moveNestedBetweenColumns(twoCols, 0, 0, 1, 0)
    expect(colIds(next!, 0)).toEqual(['b'])
    expect(colIds(next!, 1)).toEqual(['a', 'c'])
  })

  it('reorders within the same column (drag onto a row below)', () => {
    // drag `a` onto `b`: removing a shifts indices, so it lands before b (no-op position)
    const noop = moveNestedBetweenColumns(twoCols, 0, 0, 0, 1)
    expect(colIds(noop!, 0)).toEqual(['a', 'b'])
    // drag `b` onto `a` (row above): b lands before a
    const next = moveNestedBetweenColumns(twoCols, 0, 1, 0, 0)
    expect(colIds(next!, 0)).toEqual(['b', 'a'])
  })

  it('returns null for unknown indices', () => {
    expect(moveNestedBetweenColumns(twoCols, 0, 9, 1)).toBeNull()
    expect(moveNestedBetweenColumns(twoCols, 9, 0, 1)).toBeNull()
    expect(moveNestedBetweenColumns(twoCols, 0, 0, 9)).toBeNull()
  })

  it('does not mutate the input items', () => {
    const copy = JSON.parse(JSON.stringify(twoCols))
    moveNestedBetweenColumns(twoCols, 0, 0, 1)
    expect(JSON.parse(JSON.stringify(twoCols))).toEqual(copy)
  })
})

describe('promoteNestedBlock (nested → top level)', () => {
  const page: Block[] = [
    block('hero-top', 'home'),
    columnsBlock('cols', [
      { width: '50%', blocks: [block('n1'), block('n2')] },
      { width: '50%', blocks: [] },
    ], 'home'),
    block('cta-top', 'home'),
  ]

  it('inserts the promoted block before the drop target and adopts its window', () => {
    const next = promoteNestedBlock(page, 'cols', 'n1', 'cta-top')
    expect(next?.map(b => b.id)).toEqual(['hero-top', 'cols', 'n1', 'cta-top'])
    expect(next?.[2]?.windowId).toBe('home')
    // n1 no longer lives inside the columns block
    const parent = next?.find(b => b.id === 'cols')
    const remaining = (parent?.content?.items as any[])[0].blocks.map((b: Block) => b.id)
    expect(remaining).toEqual(['n2'])
  })

  it('inserts right after the parent when no target is given', () => {
    const next = promoteNestedBlock(page, 'cols', 'n2')
    expect(next?.map(b => b.id)).toEqual(['hero-top', 'cols', 'n2', 'cta-top'])
  })

  it('returns null for an unknown nested id or parent', () => {
    expect(promoteNestedBlock(page, 'cols', 'nope')).toBeNull()
    expect(promoteNestedBlock(page, 'nope', 'n1')).toBeNull()
  })
})

describe('demoteBlock (top level → column)', () => {
  const page: Block[] = [
    block('hero-top', 'home'),
    columnsBlock('cols', [
      { width: '50%', blocks: [block('n1')] },
      { width: '50%', blocks: [] },
    ], 'home'),
    block('cta-top', 'home'),
  ]

  it('removes the block from the page and appends it to the column', () => {
    const next = demoteBlock(page, 'cta-top', 'cols', 1)
    expect(next?.map(b => b.id)).toEqual(['hero-top', 'cols'])
    const col1 = (next?.[1]?.content?.items as any[])[1]
    expect(col1.blocks.map((b: Block) => b.id)).toEqual(['cta-top'])
    expect(col1.blocks[0].windowId).toBe('home')
  })

  it('inserts before an existing nested block when a target is given', () => {
    const next = demoteBlock(page, 'cta-top', 'cols', 0, 'n1')
    const col0 = (next?.[1]?.content?.items as any[])[0]
    expect(col0.blocks.map((b: Block) => b.id)).toEqual(['cta-top', 'n1'])
  })

  it('rejects columns / navbar / footer blocks', () => {
    const withFooter = [...page, block('footer-top', 'home')]
    const footerBlock = withFooter[withFooter.length - 1]!
    const asFooter = { ...footerBlock, type: 'footer' }
    const withRealFooter = [...page, asFooter]
    expect(demoteBlock(withRealFooter, 'footer-top', 'cols', 1)).toBeNull()
    expect(demoteBlock(page, 'cols', 'cols', 1)).toBeNull()
  })

  it('returns null when the parent is unknown', () => {
    expect(demoteBlock(page, 'cta-top', 'nope', 1)).toBeNull()
  })
})

describe('blockHasProductContent', () => {
  it('detects blocks that list products or reference a product', () => {
    expect(blockHasProductContent({ id: 'x', type: 'product-grid', settings: {}, content: { products: [{ id: 1 }] } } as Block)).toBe(true)
    expect(blockHasProductContent({ id: 'x', type: 'hero', settings: {}, content: { productId: 'p1' } } as Block)).toBe(true)
    expect(blockHasProductContent({ id: 'x', type: 'hero', settings: {}, content: { slug: 'camiseta' } } as Block)).toBe(true)
  })

  it('detects blocks living inside a product landing window', () => {
    expect(blockHasProductContent({ id: 'x', type: 'hero', windowId: 'product:p1', settings: {}, content: {} } as Block)).toBe(true)
  })

  it('returns false for plain blocks', () => {
    expect(blockHasProductContent({ id: 'x', type: 'hero', settings: {}, content: { title: 'Hola' } } as Block)).toBe(false)
    expect(blockHasProductContent({ id: 'x', type: 'features', settings: {}, content: {} } as Block)).toBe(false)
  })
})

describe('moveBlockToWindow (drop on a window header)', () => {
  const page: Block[] = [
    block('hero-top', 'home'),
    block('feat-top', 'home'),
    block('cat-grid', 'catalogo'),
    block('cat-countdown', 'catalogo'),
  ]

  it('moves the block to the end of the target window group', () => {
    const next = moveBlockToWindow(page, 'hero-top', 'catalogo')
    expect(next?.map(b => b.id)).toEqual(['feat-top', 'cat-grid', 'cat-countdown', 'hero-top'])
    expect(next?.find(b => b.id === 'hero-top')?.windowId).toBe('catalogo')
  })

  it('returns null for the same window, unknown ids and global blocks', () => {
    expect(moveBlockToWindow(page, 'hero-top', 'home')).toBeNull()
    expect(moveBlockToWindow(page, 'nope', 'catalogo')).toBeNull()
    const nav = { ...block('nav-top', 'home'), type: 'navbar' }
    expect(moveBlockToWindow([...page, nav], 'nav-top', 'catalogo')).toBeNull()
  })

  it('does not mutate the input', () => {
    const copy = [...page]
    moveBlockToWindow(page, 'hero-top', 'catalogo')
    expect(page.map(b => b.id)).toEqual(copy.map(b => b.id))
  })
})

describe('promoteNestedBlockToWindow (nested → window header)', () => {
  const page: Block[] = [
    block('hero-top', 'home'),
    columnsBlock('cols', [
      { width: '50%', blocks: [block('n1'), block('n2')] },
      { width: '50%', blocks: [] },
    ], 'home'),
    block('cat-grid', 'catalogo'),
  ]

  it('removes the nested block and appends it to the target window group', () => {
    const next = promoteNestedBlockToWindow(page, 'cols', 'n1', 'catalogo')
    expect(next?.map(b => b.id)).toEqual(['hero-top', 'cols', 'cat-grid', 'n1'])
    expect(next?.find(b => b.id === 'n1')?.windowId).toBe('catalogo')
    const remaining = (next?.find(b => b.id === 'cols')?.content?.items as any[])[0].blocks.map((b: Block) => b.id)
    expect(remaining).toEqual(['n2'])
  })

  it('returns null for unknown nested ids or parents', () => {
    expect(promoteNestedBlockToWindow(page, 'cols', 'nope', 'catalogo')).toBeNull()
    expect(promoteNestedBlockToWindow(page, 'nope', 'n1', 'catalogo')).toBeNull()
  })
})
