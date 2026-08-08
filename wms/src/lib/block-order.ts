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
