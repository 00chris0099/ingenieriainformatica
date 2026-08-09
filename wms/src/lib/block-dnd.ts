/**
 * Shared drag & drop payload between the builder's block list (left panel)
 * and the columns editor (right inspector). Both ends must use this MIME
 * type so a drag started in one pane can be dropped in the other.
 */
export const BLOCK_DND_MIME = 'application/x-freebuff-block'

export type BlockDragPayload =
  | { kind: 'top'; blockId: string }
  | { kind: 'nested'; blockId: string; parentId: string; colIdx: number; nbIdx: number }

/** Minimal shape so real DragEvents and test mocks both work. */
export interface DragDataTransferLike {
  setData?: (type: string, value: string) => void
  getData?: (type: string) => string
}

export function setDragPayload(e: { dataTransfer: DragDataTransferLike }, payload: BlockDragPayload) {
  try {
    e.dataTransfer.setData?.(BLOCK_DND_MIME, JSON.stringify(payload))
    e.dataTransfer.setData?.('text/plain', payload.blockId)
  } catch { /* ignore */ }
}

export function readDragPayload(e: { dataTransfer: DragDataTransferLike }): BlockDragPayload | null {
  try {
    const raw = e.dataTransfer.getData?.(BLOCK_DND_MIME)
    if (!raw) return null
    return JSON.parse(raw) as BlockDragPayload
  } catch {
    return null
  }
}
