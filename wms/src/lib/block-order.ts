import type { Block } from '@repo/blocks'

/**
 * Reorders `draggedId` to sit just before `targetId` (same window only).
 * Returns a new array, or `null` when the move is not possible (unknown ids,
 * same block, or blocks in different windows) so the caller can ignore it.
 */
export function moveBlockTo(blocks: Block[], draggedId: string, targetId: string): Block[] | null {
  if (!draggedId || !targetId || draggedId === targetId) return null
  const draggedIdx = blocks.findIndex(b => b.id === draggedId)
  const targetIdx = blocks.findIndex(b => b.id === targetId)
  if (draggedIdx < 0 || targetIdx < 0) return null
  const draggedWin = blocks[draggedIdx]!.windowId || 'home'
  const targetWin = blocks[targetIdx]!.windowId || 'home'
  if (draggedWin !== targetWin) return null

  const updated = [...blocks]
  const item = updated[draggedIdx]!
  updated.splice(draggedIdx, 1)
  const insertAt = updated.findIndex(b => b.id === targetId)
  if (insertAt < 0) return null
  updated.splice(insertAt, 0, item)
  return updated
}

// ── Nested blocks inside a `columns` block ───────────────────────────────

export interface ColumnItem {
  width?: string
  blocks?: Block[]
}

/**
 * Moves a nested block from one column to another (or within the same one).
 * `beforeIdx` is the index of the drop-target row in the *original* array; when
 * omitted the block is appended to the destination column.
 */
export function moveNestedBetweenColumns(
  items: ColumnItem[],
  fromCol: number,
  fromIdx: number,
  toCol: number,
  beforeIdx?: number
): ColumnItem[] | null {
  const src = items[fromCol]
  const srcBlocks = Array.isArray(src?.blocks) ? src.blocks : []
  const dst = items[toCol]
  if (!src || !dst || fromIdx < 0 || fromIdx >= srcBlocks.length) return null
  const moving = srcBlocks[fromIdx]!
  const dstBlocksOrig = Array.isArray(dst.blocks) ? dst.blocks : []

  // Insertion point in *original* coordinates, then adjust for the removal:
  // when moving within the same column, indices after the source shift down by one.
  let insertAt = beforeIdx !== undefined && beforeIdx >= 0 && beforeIdx < dstBlocksOrig.length
    ? beforeIdx
    : dstBlocksOrig.length
  if (toCol === fromCol && insertAt > fromIdx) insertAt -= 1

  const next = items.map(c => ({ ...c, blocks: Array.isArray(c?.blocks) ? [...c.blocks] : [] }))
  next[fromCol]!.blocks.splice(fromIdx, 1)
  next[toCol]!.blocks.splice(insertAt, 0, moving)
  return next
}

/**
 * Pulls a nested block out of its parent `columns` block and places it at the
 * top level, just before `targetTopId` (or right after the parent when no
 * target is given). The promoted block adopts the target's window when it has
 * one, so it lands in the visible group where it was dropped.
 */
export function promoteNestedBlock(
  blocks: Block[],
  parentId: string,
  nestedId: string,
  targetTopId?: string
): Block[] | null {
  const parentIdx = blocks.findIndex(b => b.id === parentId)
  if (parentIdx < 0) return null
  const parent = blocks[parentIdx]!
  const items = Array.isArray(parent.content?.items) ? parent.content.items as ColumnItem[] : []

  const { items: newItems, removed } = findAndRemoveNested(items, nestedId)
  if (!removed) return null

  const target = targetTopId ? blocks.find(b => b.id === targetTopId) : undefined
  const parentWin = parent.windowId || 'home'
  const promoted: Block = {
    ...removed,
    windowId: target?.windowId || removed.windowId || parentWin,
  }

  const updated = [...blocks]
  updated[parentIdx] = { ...parent, content: { ...parent.content, items: newItems } }
  const insertAt = target && targetTopId !== parentId
    ? updated.findIndex(b => b.id === targetTopId)
    : parentIdx + 1
  if (insertAt < 0) return null
  updated.splice(insertAt, 0, promoted)
  return updated
}

/** Removes `nestedId` from the first column that contains it. Returns the new items and the removed block. */
function findAndRemoveNested(items: ColumnItem[], nestedId: string): { items: ColumnItem[]; removed: Block | null } {
  let removed: Block | null = null
  const newItems: ColumnItem[] = []
  for (const col of items) {
    const colBlocks = Array.isArray(col?.blocks) ? col.blocks : []
    const idx = colBlocks.findIndex(b => b.id === nestedId)
    if (idx >= 0 && !removed) {
      removed = colBlocks[idx]!
      const rest = [...colBlocks]
      rest.splice(idx, 1)
      newItems.push({ ...col, blocks: rest })
    } else {
      newItems.push(col)
    }
  }
  return { items: newItems, removed }
}

/** Appends `item` at the end of the block group that belongs to `windowId`. */
function appendToWindowGroup(blocks: Block[], item: Block, windowId: string): Block[] {
  const updated = [...blocks]
  let insertAt = updated.length
  for (let i = updated.length - 1; i >= 0; i--) {
    if ((updated[i]!.windowId || 'home') === windowId) {
      insertAt = i + 1
      break
    }
  }
  updated.splice(insertAt, 0, item)
  return updated
}

/**
 * True when the block carries product-bound content: it lists products, links
 * a specific product (productId/slug), or lives inside a product landing
 * window (`product:<id>`).
 */
export function blockHasProductContent(b: Block): boolean {
  const c = (b.content || {}) as Record<string, any>
  if (Array.isArray(c.products) && c.products.length > 0) return true
  if (c.productId || c.slug) return true
  return String(b.windowId || '').startsWith('product:')
}

/**
 * Moves a top-level block to another window, placing it at the end of that
 * window's group. Returns null when the block is unknown, already belongs to
 * that window, or is a global block (navbar/footer).
 */
export function moveBlockToWindow(blocks: Block[], blockId: string, windowId: string): Block[] | null {
  const idx = blocks.findIndex(b => b.id === blockId)
  if (idx < 0) return null
  const cur = blocks[idx]!
  if (cur.type === 'navbar' || cur.type === 'footer') return null
  if ((cur.windowId || 'home') === windowId) return null
  return appendToWindowGroup(blocks.filter(b => b.id !== blockId), { ...cur, windowId }, windowId)
}

/**
 * Pulls a nested block out of its parent `columns` block and appends it to the
 * end of the given window's group (used when dropping on a window header).
 */
export function promoteNestedBlockToWindow(
  blocks: Block[],
  parentId: string,
  nestedId: string,
  windowId: string
): Block[] | null {
  const parentIdx = blocks.findIndex(b => b.id === parentId)
  if (parentIdx < 0) return null
  const parent = blocks[parentIdx]!
  const items = Array.isArray(parent.content?.items) ? parent.content.items as ColumnItem[] : []
  const { items: newItems, removed } = findAndRemoveNested(items, nestedId)
  if (!removed) return null

  const updated = [...blocks]
  updated[parentIdx] = { ...parent, content: { ...parent.content, items: newItems } }
  return appendToWindowGroup(updated, { ...removed, windowId }, windowId)
}

/**
 * Pulls a top-level block down into a column of the parent `columns` block.
 * `beforeNbId` optionally inserts it before an existing nested block;
 * otherwise it is appended. The demoted block inherits the parent's window.
 */
export function demoteBlock(
  blocks: Block[],
  blockId: string,
  parentId: string,
  colIdx: number,
  beforeNbId?: string
): Block[] | null {
  const idx = blocks.findIndex(b => b.id === blockId)
  const parentIdx = blocks.findIndex(b => b.id === parentId)
  if (idx < 0 || parentIdx < 0 || idx === parentIdx) return null
  const moving = blocks[idx]!
  if (moving.type === 'columns' || moving.type === 'navbar' || moving.type === 'footer') return null
  const parent = blocks[parentIdx]!

  const cols = Math.max(1, parseInt(String(parent.settings?.columns || '2'), 10) || 2)
  const items = Array.isArray(parent.content?.items) ? [...(parent.content.items as ColumnItem[])] : []
  while (items.length < Math.max(cols, colIdx + 1)) {
    items.push({ width: `${Math.round(100 / cols)}%`, blocks: [] })
  }
  const col = items[colIdx] ?? { width: `${Math.round(100 / cols)}%`, blocks: [] }
  const colBlocks = Array.isArray(col.blocks) ? [...col.blocks] : []
  let insertAt = colBlocks.length
  if (beforeNbId) {
    const bi = colBlocks.findIndex(b => b.id === beforeNbId)
    if (bi >= 0) insertAt = bi
  }
  colBlocks.splice(insertAt, 0, { ...moving, windowId: parent.windowId || moving.windowId || 'home' })

  const nextItems = [...items]
  nextItems[colIdx] = { ...col, blocks: colBlocks }

  const updated = [...blocks]
  updated.splice(idx, 1)
  const parentNewIdx = updated.findIndex(b => b.id === parentId)
  if (parentNewIdx < 0) return null
  updated[parentNewIdx] = { ...parent, content: { ...parent.content, items: nextItems } }
  return updated
}
