'use client'

import { useState, useEffect, useCallback, useMemo, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Eye, ArrowLeft, Undo, Redo, Plus, Monitor, Tablet, Smartphone,
  Wand2, Check, Sparkles, X, Send, Bot, Layers, Sliders, Maximize2, Minimize2, ExternalLink,
  Settings2, LayoutGrid, Trash2, Home, FilePlus2, Pencil, Copy, AlertTriangle, GripVertical, Search, ChevronDown, ChevronsDown, ChevronsUp, ZoomIn, ZoomOut, RotateCw, Frame, Rocket, Loader2, ShoppingBag, MoveRight
} from 'lucide-react'
import { Block, blockRegistry } from '@repo/blocks'
import BlockEditor from '@/components/builder/BlockEditor'
import ImageUploadField from '@/components/builder/ImageUploadField'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { Button } from '@/components/ui/Button'
import { reorderLinksByStoredOrder, windowIdsFromLinks } from '@/lib/window-order'
import { moveBlockTo, promoteNestedBlock, demoteBlock, moveBlockToWindow, promoteNestedBlockToWindow, blockHasProductContent, moveNestedBetweenColumns } from '@/lib/block-order'
import { setDragPayload, readDragPayload, type BlockDragPayload } from '@/lib/block-dnd'

interface PageData {
  id: string
  title: string
  slug: string
  type: string
  status: string
  blocks: Block[]
  seo?: Record<string, any>
  settings?: Record<string, any>
}

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
  blocks?: Block[]
  seo?: Record<string, any>
  provider?: string
  model?: string
  applied?: boolean
  discarded?: boolean
}

const BLOCK_LABELS: Record<string, string> = {
  navbar: 'Barra de Navegación', hero: 'Hero / Portada', 'product-grid': 'Catálogo de Productos',
  features: 'Beneficios', testimonials: 'Testimonios', cta: 'Llamado a la Acción',
  footer: 'Pie de Página', countdown: 'Cuenta Regresiva', faq: 'Preguntas Frecuentes',
  newsletter: 'Newsletter', 'social-proof': 'Prueba Social', pricing: 'Precios',
  contact: 'Contacto', gallery: 'Galería', about: 'Nosotros', team: 'Equipo',
}

// ── Builder persistence (localStorage) ───────────────────────────────────
const orderStorageKey = (pageId: string) => `builder:window-order:${pageId}`
const searchStorageKey = (pageId: string) => `builder:window-search:${pageId}`
const previewWindowKey = (pageId: string) => `builder:preview-window:${pageId}`
const chatMessagesKey = (pageId: string) => `builder:chat-messages:${pageId}`
const selectedBlockKey = (pageId: string) => `builder:selected-block:${pageId}`
const canvasScrollKey = (pageId: string) => `builder:canvas-scroll:${pageId}`
const blockFilterKey = (pageId: string) => `builder:block-filter:${pageId}`
const blockSearchKey = (pageId: string) => `builder:block-search:${pageId}`
const windowCollapseKey = (pageId: string) => `builder:window-collapse:${pageId}`
const deviceKey = 'builder:device'
const zoomKey = 'builder:zoom'
const aiChatOpenKey = 'builder:ai-chat-open'

function readStored(key: string): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null } catch { return null }
}
function writeStored(key: string, value: string) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value) } catch { /* ignore */ }
}

export default function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params)
  const router = useRouter()

  const [page, setPage] = useState<PageData | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [zoom, setZoom] = useState(100)
  const [fullScreen, setFullScreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  // Undo / Redo history
  const [history, setHistory] = useState<Block[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Sidebars
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [blockFilter, setBlockFilter] = useState('')
  const [blockSearch, setBlockSearch] = useState('')
  const [collapsedWindows, setCollapsedWindows] = useState<string[]>([])

  // Multi-window canvas + site settings
  const [previewWindow, setPreviewWindow] = useState<string>('home')
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  const [addingWindow, setAddingWindow] = useState(false)
  const [newWindowName, setNewWindowName] = useState('')
  const [renamingWindow, setRenamingWindow] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteWindow, setConfirmDeleteWindow] = useState<string | null>(null)
  const [windowSearch, setWindowSearch] = useState('')
  const [dragWindowId, setDragWindowId] = useState<string | null>(null)
  const [dragOverWindowId, setDragOverWindowId] = useState<string | null>(null)
  const [dragBlockId, setDragBlockId] = useState<string | null>(null)
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null)
  const [dragOverWindowHeader, setDragOverWindowHeader] = useState<string | null>(null)
  const [confirmMoveWindow, setConfirmMoveWindow] = useState<{ payload: BlockDragPayload; targetWindow: string } | null>(null)
  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({})

  // Canvas scroll persistence (outer container, per window)
  const outerScrollRef = useRef<HTMLDivElement>(null)
  const pendingScrollRestore = useRef(false)
  const lastScrollWindowRef = useRef<string>('home')
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Left panel blocks list scroll persistence
  const blocksListRef = useRef<HTMLDivElement>(null)
  const blocksListScroll = useRef(0)
  const handleBlocksListScroll = () => {
    if (blocksListRef.current) blocksListScroll.current = blocksListRef.current.scrollTop
  }

  // Scroll the selected block's row into view when the selection comes from outside the list
  const scrollToSelectedRef = useRef(false)
  const [flashBlockId, setFlashBlockId] = useState<string | null>(null)

  // True when the current zoom was set by auto-fit (so resize re-fits); false = user chose it manually
  const fitManagedRef = useRef(false)

  // Latest selection id (used to ignore duplicate canvas clicks) + retry budget for scroll-into-view
  const selectedBlockIdRef = useRef<string | null>(null)
  const scrollRetryRef = useRef(0)

  // AI Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy tu Copiloto de IA para diseño de tiendas virtuales. Dime qué cambios deseas realizar (ej: "Agrega una colección de ropa de invierno con ofertas", "Cambia la paleta a tonos rosé", "Optimiza los botones de compra").',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SELECT_BLOCK' && e.data.blockId) {
        if (selectedBlockIdRef.current !== e.data.blockId) {
          selectedBlockIdRef.current = e.data.blockId
          scrollRetryRef.current = 0
          scrollToSelectedRef.current = true
          setSelectedBlockId(e.data.blockId)
        }
      }
      if (e.data && e.data.type === 'NAVIGATE_WINDOW' && e.data.windowId) {
        setPreviewWindow(e.data.windowId)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    fetchPage()
  }, [pageId])

  // Restore the persisted window search across reloads
  useEffect(() => {
    setWindowSearch(readStored(searchStorageKey(pageId)) || '')
  }, [pageId])

  // Restore the persisted block-type filter, text search and collapsed window groups across reloads
  useEffect(() => {
    setBlockFilter(readStored(blockFilterKey(pageId)) || '')
    setBlockSearch(readStored(blockSearchKey(pageId)) || '')
    const raw = readStored(windowCollapseKey(pageId))
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCollapsedWindows(parsed.filter((w: unknown) => typeof w === 'string'))
      } catch { /* ignore */ }
    }
  }, [pageId])

  // Restore device preference, canvas zoom and AI chat state across reloads
  useEffect(() => {
    const d = readStored(deviceKey)
    if (d === 'desktop' || d === 'tablet' || d === 'mobile') setDevice(d as any)
    const z = Number(readStored(zoomKey))
    if (z >= 25 && z <= 150) setZoom(z)
    setShowAIChat(readStored(aiChatOpenKey) === 'true')
    const raw = readStored(chatMessagesKey(pageId))
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setChatMessages(parsed)
      } catch { /* ignore */ }
    }
  }, [pageId])

  // Persist canvas window (per page), device and AI chat state
  useEffect(() => { writeStored(previewWindowKey(pageId), previewWindow) }, [previewWindow, pageId])
  useEffect(() => { writeStored(deviceKey, device) }, [device])
  useEffect(() => { writeStored(zoomKey, String(zoom)) }, [zoom])
  useEffect(() => { writeStored(aiChatOpenKey, String(showAIChat)) }, [showAIChat])
  useEffect(() => { writeStored(chatMessagesKey(pageId), JSON.stringify(chatMessages)) }, [chatMessages, pageId])

  // Persist the selected block in the inspector (per page)
  useEffect(() => { writeStored(selectedBlockKey(pageId), selectedBlockId ?? '') }, [selectedBlockId, pageId])

  // ── Canvas scroll persistence (per window) ──────────────────────────────
  /** Reads the current canvas scroll (outer container) */
  const readCanvasScroll = (): { top: number; inner: number } => {
    const top = outerScrollRef.current?.scrollTop ?? 0
    return { top, inner: 0 }
  }

  /** Saves the current canvas scroll under the given window */
  const saveCanvasScroll = (windowId: string) => {
    let map: Record<string, { top: number; inner: number }> = {}
    try {
      const raw = readStored(canvasScrollKey(pageId))
      if (raw) map = JSON.parse(raw)
    } catch { /* ignore */ }
    map[windowId] = readCanvasScroll()
    writeStored(canvasScrollKey(pageId), JSON.stringify(map))
  }

  /** Restores the stored canvas scroll for the given window */
  const restoreCanvasScroll = (windowId: string) => {
    const raw = readStored(canvasScrollKey(pageId))
    if (!raw) return
    let map: Record<string, { top: number; inner: number }> = {}
    try { map = JSON.parse(raw) } catch { return }
    const pos = map[windowId]
    if (!pos) return
    requestAnimationFrame(() => {
      if (outerScrollRef.current) outerScrollRef.current.scrollTop = pos.top ?? 0
    })
  }

  /** Debounced save while the user scrolls the canvas */
  const handleCanvasScroll = () => {
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current)
    scrollSaveTimer.current = setTimeout(() => saveCanvasScroll(previewWindow), 400)
  }

  // Track the active window and mark the next render to restore its scroll
  useEffect(() => {
    lastScrollWindowRef.current = previewWindow
    pendingScrollRestore.current = true
  }, [previewWindow, pageId])

  // Restore the persisted canvas scroll once the new window's blocks are rendered
  useEffect(() => {
    if (!pendingScrollRestore.current || blocks.length === 0) return
    pendingScrollRestore.current = false
    const t = requestAnimationFrame(() => restoreCanvasScroll(previewWindow))
    return () => cancelAnimationFrame(t)
  }, [blocks, previewWindow])

  // Save the canvas scroll on unload so a reload restores the exact position
  useEffect(() => {
    const onUnload = () => saveCanvasScroll(lastScrollWindowRef.current)
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('pagehide', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      window.removeEventListener('pagehide', onUnload)
    }
  }, [pageId])

  // Keep the blocks list scrolled to the same place when its content changes or a block is selected
  useEffect(() => {
    const el = blocksListRef.current
    if (el && Math.abs(el.scrollTop - blocksListScroll.current) > 1) {
      el.scrollTop = blocksListScroll.current
    }
  }, [blocks, selectedBlockId])

  // When a block is selected from the canvas or the AI chat, bring its row into view.
  // block: 'nearest' only scrolls when the row is not fully visible — position is kept otherwise.
  useEffect(() => {
    if (!scrollToSelectedRef.current || !selectedBlockId) return
    const row = blocksListRef.current?.querySelector(`[data-block-id="${CSS.escape(selectedBlockId)}"]`)
    if (!row) {
      // The block may be hidden by the active filter/search or a collapsed window group
      const target = blocks.find(b => b.id === selectedBlockId)
      if (!target) { scrollToSelectedRef.current = false; return }
      if (!visibleBlocks.some(x => x.id === selectedBlockId)) {
        if (blockFilter) { setBlockFilter(''); writeStored(blockFilterKey(pageId), '') }
        if (blockSearch.trim()) { setBlockSearch(''); writeStored(blockSearchKey(pageId), '') }
      }
      const targetWindow = target.windowId || 'home'
      if (collapsedWindows.includes(targetWindow)) {
        const next = collapsedWindows.filter(w => w !== targetWindow)
        setCollapsedWindows(next)
        writeStored(windowCollapseKey(pageId), JSON.stringify(next))
      }
      // Hard budget: never retry more than 3 times per selection (guarantees no loop)
      scrollRetryRef.current += 1
      if (scrollRetryRef.current > 3) {
        scrollToSelectedRef.current = false
        scrollRetryRef.current = 0
        return
      }
      scrollToSelectedRef.current = true
      return
    }
    scrollRetryRef.current = 0
    scrollToSelectedRef.current = false
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setFlashBlockId(selectedBlockId)
    const t = setTimeout(() => setFlashBlockId(null), 1600)
    return () => clearTimeout(t)
  }, [selectedBlockId, blockFilter, blockSearch, collapsedWindows])

  /** Persists the current menu order (navbar links) so it survives reloads */
  const persistWindowOrder = (bs: Block[]) => {
    const navbar = bs.find(b => b.type === 'navbar')
    const links = Array.isArray(navbar?.content?.links) ? navbar.content.links : []
    writeStored(orderStorageKey(pageId), JSON.stringify(windowIdsFromLinks(links)))
  }

  /** Applies the persisted menu order to freshly loaded blocks (safe when windows were added/removed) */
  const applyStoredWindowOrder = (bs: Block[]): Block[] => {
    const raw = readStored(orderStorageKey(pageId))
    if (!raw) return bs
    let order: string[]
    try { order = JSON.parse(raw) } catch { return bs }
    if (!Array.isArray(order)) return bs
    const navbar = bs.find(b => b.type === 'navbar')
    if (!navbar || !Array.isArray(navbar.content?.links)) return bs
    const sorted = reorderLinksByStoredOrder(navbar.content.links, order)
    return bs.map(b => b.id === navbar.id ? { ...b, content: { ...navbar.content, links: sorted } } : b)
  }

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/v1/pages/${pageId}`)
      if (res.ok) {
        const data = await res.json()
        const pageData = data.data
        if (pageData) {
          setPage(pageData)
          const loadedBlocks: Block[] = Array.isArray(pageData.blocks) ? (pageData.blocks as Block[]) : []
          const orderedBlocks = applyStoredWindowOrder(loadedBlocks)
          setBlocks(orderedBlocks)
          setHistory([orderedBlocks])
          setHistoryIndex(0)
          setSiteSettings(pageData.settings || {})
          // Restore the last active canvas window if it still exists on the page
          const storedPreview = readStored(previewWindowKey(pageId))
          if (storedPreview) {
            const known = new Set<string>(['home'])
            orderedBlocks.forEach(b => { if (b.windowId) known.add(b.windowId) })
            const nav = orderedBlocks.find(b => b.type === 'navbar')
            ;(nav?.content?.links || []).forEach((l: any) => {
              const w = l?.windowId
              if (w && w !== 'whatsapp' && !String(w).startsWith('product:')) known.add(String(w))
            })
            if (known.has(storedPreview)) setPreviewWindow(storedPreview)
          }
          // Restore the last selected block in the inspector if it still exists
          const storedBlock = readStored(selectedBlockKey(pageId))
          if (storedBlock && orderedBlocks.some(b => b.id === storedBlock)) {
            setSelectedBlockId(storedBlock)
          }
          setLoading(false)
          return
        }
      }
    } catch (error) { console.error('Error fetching page:', error) }

    // Fallback: create synthetic page so the editor always opens
    setPage({
      id: pageId,
      title: 'Tienda Moda & Tendencias',
      slug: pageId.replace('page-', 'tienda-'),
      type: 'store',
      status: 'draft',
      blocks: [],
    })
    setBlocks([])
    setHistory([[]])
    setHistoryIndex(0)
    setLoading(false)
  }

  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      next.push(newBlocks)
      return next
    })
    setHistoryIndex(prev => prev + 1)
  }, [historyIndex])

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks)
    pushHistory(newBlocks)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1
      const target = history[prevIndex]
      if (target) {
        setHistoryIndex(prevIndex)
        setBlocks(target)
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const target = history[nextIndex]
      if (target) {
        setHistoryIndex(nextIndex)
        setBlocks(target)
      }
    }
  }

  const handleAddBlock = (type: string) => {
    const config = blockRegistry.get(type as any)
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      settings: config?.defaultSettings || {},
      content: config?.defaultContent || {},
    }
    const updated = [...blocks, newBlock]
    updateBlocks(updated)
    setSelectedBlockId(newBlock.id)
    setShowBlockPicker(false)
  }

  const handleUpdateBlock = (id: string, settings: Record<string, any>, content: Record<string, any>) => {
    const updated = blocks.map(b => b.id === id ? { ...b, settings, content } : b)
    updateBlocks(updated)
  }

  const handleDuplicateBlock = (id: string) => {
    const blockToDup = blocks.find(b => b.id === id)
    if (!blockToDup) return
    const newBlock: Block = {
      ...JSON.parse(JSON.stringify(blockToDup)),
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    }
    const index = blocks.findIndex(b => b.id === id)
    const updated = [...blocks]
    updated.splice(index + 1, 0, newBlock)
    updateBlocks(updated)
    setSelectedBlockId(newBlock.id)
  }

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id)
    updateBlocks(updated)
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  // ── Multi-window manager ───────────────────────────────────────────────
  /** Windows are derived from block windowIds + navbar links */
  const windows = useMemo(() => {
    const set = new Set<string>(['home'])
    blocks.forEach(b => { if (b.windowId) set.add(b.windowId) })
    const navbar = blocks.find(b => b.type === 'navbar')
    ;(navbar?.content?.links || []).forEach((l: any) => {
      const w = l?.windowId
      if (w && w !== 'home' && w !== 'whatsapp' && !String(w).startsWith('product:')) set.add(String(w))
    })
    return Array.from(set)
  }, [blocks])

  /** Windows in menu order: Inicio first, then navbar link order, then unlinked windows */
  const orderedWindows = useMemo(() => {
    const navbar = blocks.find(b => b.type === 'navbar')
    const links = Array.isArray(navbar?.content?.links) ? navbar.content.links : []
    const ordered: string[] = ['home']
    const seen = new Set<string>(['home'])
    for (const l of links) {
      const w = l?.windowId
      if (w && w !== 'home' && w !== 'whatsapp' && !String(w).startsWith('product:')) {
        const id = String(w)
        if (!seen.has(id)) { ordered.push(id); seen.add(id) }
      }
    }
    for (const w of windows) {
      if (!seen.has(w)) { ordered.push(w); seen.add(w) }
    }
    return ordered
  }, [blocks, windows])

  /** Search-filtered windows (accent/case insensitive) */
  const visibleWindows = useMemo(() => {
    const q = windowSearch.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!q) return orderedWindows
    return orderedWindows.filter(w =>
      windowLabel(w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    )
  }, [orderedWindows, windowSearch])

  /** Drag & drop reorder: moves the window's navbar link (creates one if missing) */
  const reorderWindow = (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId || fromId === 'home') return
    const navbar = blocks.find(b => b.type === 'navbar')
    if (!navbar) return
    const links = Array.isArray(navbar.content?.links) ? [...navbar.content.links] : []
    const fromIdx = links.findIndex((l: any) => l?.windowId === fromId)

    // Target slot inside the links array (0 = first menu item after Inicio)
    let targetIdx: number
    if (toId === '__end__') {
      targetIdx = links.length
    } else if (toId === 'home') {
      targetIdx = 0
    } else {
      const toIdx = links.findIndex((l: any) => l?.windowId === toId)
      targetIdx = toIdx === -1 ? links.length : toIdx
    }

    let item: any = null
    let arr = links
    if (fromIdx !== -1) {
      item = links[fromIdx]!
      arr = links.filter((_, i) => i !== fromIdx)
      if (fromIdx < targetIdx) targetIdx -= 1
    }

    // Windows without a menu link get one created at the drop position
    const moved = item ?? { label: windowLabel(fromId), windowId: fromId, iconName: 'Home' }
    const next = [...arr]
    next.splice(Math.max(0, Math.min(targetIdx, next.length)), 0, moved)

    const updated = blocks.map(b => b.id === navbar.id ? { ...b, content: { ...navbar.content, links: next } } : b)
    updateBlocks(updated)
    persistWindowOrder(updated)
    setDragWindowId(null)
    setDragOverWindowId(null)
  }

  const handleWindowChange = (id: string, windowId: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, windowId } : b)
    updateBlocks(updated)
  }

  const handleMoveBlock = (id: string, dir: -1 | 1) => {
    const index = blocks.findIndex(b => b.id === id)
    if (index < 0) return
    const win = blocks[index]!.windowId || 'home'
    const inWindow = blocks.map((b, i) => ({ b, i })).filter(x => (x.b.windowId || 'home') === win)
    const pos = inWindow.findIndex(x => x.b.id === id)
    const targetPos = pos + dir
    const target = inWindow[targetPos]
    if (!target) return
    const updated = [...blocks]
    const item = updated[index]!
    updated.splice(index, 1)
    const targetIndex = updated.findIndex(b => b.id === target.b.id)
    updated.splice(targetIndex, 0, item)
    updateBlocks(updated)
  }

  /** Drag & drop reorder: moves a block before the target (same window only) */
  const handleDropBlock = (draggedId: string, targetId: string) => {
    const updated = moveBlockTo(blocks, draggedId, targetId)
    if (!updated) return
    updateBlocks(updated)
    setSelectedBlockId(draggedId)
  }

  /** Lifts a nested block out of its `columns` parent up to the top level (before target, or after parent). */
  const handlePromoteNestedBlock = (parentId: string, nestedId: string, targetTopId?: string) => {
    const updated = promoteNestedBlock(blocks, parentId, nestedId, targetTopId)
    if (!updated) return
    updateBlocks(updated)
    setSelectedBlockId(nestedId)
  }

  /** Pulls a top-level block down into a column of the given `columns` block. */
  const handleDemoteBlock = (blockId: string, parentId: string, colIdx: number, beforeNbId?: string) => {
    const updated = demoteBlock(blocks, blockId, parentId, colIdx, beforeNbId)
    if (!updated) return
    updateBlocks(updated)
  }

  /** Finds a block by id, searching top-level blocks and nested column blocks. */
  const findBlockAnywhere = (id: string): Block | null => {
    const top = blocks.find(b => b.id === id)
    if (top) return top
    for (const b of blocks) {
      if (b.type !== 'columns') continue
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      for (const col of items) {
        const nb = (Array.isArray(col?.blocks) ? col.blocks : []).find((x: any) => x.id === id)
        if (nb) return nb as Block
      }
    }
    return null
  }

  /** Applies the actual window move (used by the drop and the confirm modal). */
  const performMoveBlockToWindow = (payload: BlockDragPayload, targetWindow: string) => {
    if (payload.kind === 'top') {
      const updated = moveBlockToWindow(blocks, payload.blockId, targetWindow)
      if (!updated) return
      updateBlocks(updated)
      setSelectedBlockId(payload.blockId)
    } else {
      const updated = promoteNestedBlockToWindow(blocks, payload.parentId, payload.blockId, targetWindow)
      if (!updated) return
      updateBlocks(updated)
      setSelectedBlockId(payload.blockId)
    }
  }

  /** Drag & drop onto a window header: moves the block to that window (confirming when it carries product content). */
  const handleDropOnWindow = (payload: BlockDragPayload, targetWindow: string) => {
    const affected = findBlockAnywhere(payload.blockId)
    if (!affected) return
    if ((affected.windowId || 'home') === targetWindow) return
    if (blockHasProductContent(affected)) {
      setConfirmMoveWindow({ payload, targetWindow })
      return
    }
    performMoveBlockToWindow(payload, targetWindow)
  }

  const confirmMoveWindowAction = () => {
    if (!confirmMoveWindow) return
    performMoveBlockToWindow(confirmMoveWindow.payload, confirmMoveWindow.targetWindow)
    setConfirmMoveWindow(null)
  }

  /** Canvas DnD: drop on a `columns` block (or a nested block inside it). */
  const handleCanvasBlockDrop = (parentId: string, colIdx: number, beforeNbId: string | undefined, payload: BlockDragPayload) => {
    if (payload.kind === 'nested') {
      // Only blocks from this same columns block can be re-nested here.
      if (payload.parentId !== parentId) return
      const parentIdx = blocks.findIndex(b => b.id === parentId)
      if (parentIdx < 0) return
      const parent = blocks[parentIdx]!
      const items = Array.isArray(parent.content?.items) ? parent.content.items as any[] : []
      const fromColBlocks = (items[payload.colIdx]?.blocks as any[]) || []
      const moved = fromColBlocks[payload.nbIdx]
      const beforeIdx = beforeNbId
        ? ((items[colIdx]?.blocks as any[]) || []).findIndex((x: any) => x.id === beforeNbId)
        : undefined
      if (payload.colIdx === colIdx && payload.nbIdx === beforeIdx) return
      const next = moveNestedBetweenColumns(items, payload.colIdx, payload.nbIdx, colIdx, beforeIdx ?? undefined)
      if (!next) return
      const updated = [...blocks]
      updated[parentIdx] = { ...parent, content: { ...parent.content, items: next } }
      updateBlocks(updated)
      if (moved) setSelectedBlockId(moved.id)
    } else {
      handleDemoteBlock(payload.blockId, parentId, colIdx, beforeNbId)
    }
  }

  // ── Keyboard shortcuts (undo/redo, delete, duplicate, move, escape) ─────
  const shortcutsRef = useRef<{
    undo: () => void
    redo: () => void
    deleteBlock: (id: string | null) => void
    duplicate: (id: string | null) => void
    move: (id: string | null, dir: -1 | 1) => void
    closeModals: () => void
  }>({ undo: () => {}, redo: () => {}, deleteBlock: () => {}, duplicate: () => {}, move: () => {}, closeModals: () => {} })
  selectedBlockIdRef.current = selectedBlockId
  shortcutsRef.current = {
    undo: handleUndo,
    redo: handleRedo,
    deleteBlock: (id) => { if (id) handleDeleteBlock(id) },
    duplicate: (id) => { if (id) handleDuplicateBlock(id) },
    move: (id, dir) => { if (id) handleMoveBlock(id, dir) },
    closeModals: () => { setShowBlockPicker(false); setShowSiteSettings(false) },
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) shortcutsRef.current.redo()
        else shortcutsRef.current.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        shortcutsRef.current.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'd') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.duplicate(selectedBlockId)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.deleteBlock(selectedBlockId)
        return
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (typing || mod) return
        e.preventDefault()
        shortcutsRef.current.move(selectedBlockId, e.key === 'ArrowUp' ? -1 : 1)
        return
      }
      if (e.key === 'Escape') {
        shortcutsRef.current.closeModals()
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const addWindow = () => {
    const name = newWindowName.trim()
    if (!name) return
    const id = slugify(name) || `ventana-${Date.now()}`
    if (windows.includes(id)) { setNewWindowName(''); setAddingWindow(false); return }
    // Add a navbar link so visitors can reach the new window
    const navbar = blocks.find(b => b.type === 'navbar')
    if (navbar) {
      const links = Array.isArray(navbar.content?.links) ? [...navbar.content.links] : []
      const updatedNav = blocks.map(b => b.id === navbar.id
        ? { ...b, content: { ...navbar.content, links: [...links, { label: name, windowId: id, iconName: 'Home' }] } }
        : b)
      updateBlocks(updatedNav)
      persistWindowOrder(updatedNav)
    }
    setNewWindowName('')
    setAddingWindow(false)
    setPreviewWindow(id)
  }

  const deleteWindow = (id: string) => {
    // Remove blocks assigned to the window + navbar links pointing to it
    const withoutBlocks = blocks.filter(b => (b.windowId || 'home') !== id)
    const updated = withoutBlocks.map(b => {
      if (b.type !== 'navbar' || !Array.isArray(b.content?.links)) return b
      const links = b.content.links.filter((l: any) => l?.windowId !== id)
      return { ...b, content: { ...b.content, links } }
    })
    updateBlocks(updated)
    persistWindowOrder(updated)
    if (previewWindow === id) setPreviewWindow('home')
  }

  /** Friendly display name of a window (prefers the navbar link label) */
  const windowLabel = (w: string) => {
    if (w === 'home') return 'Inicio'
    const navbar = blocks.find(b => b.type === 'navbar')
    const link = (Array.isArray(navbar?.content?.links) ? navbar.content.links : []).find((l: any) => l?.windowId === w)
    if (link?.label) return String(link.label)
    if (w === 'catalogo') return 'Catálogo'
    if (w === 'ofertas') return 'Ofertas'
    return w
  }

  /** Duplicates every block of a window (new ids + new windowId) and adds a navbar link */
  const duplicateWindow = (w: string) => {
    const baseName = windowLabel(w)
    const baseId = w === 'home' ? slugify(baseName) : w
    let newId = `${baseId}-copia`
    let i = 2
    while (windows.includes(newId)) newId = `${baseId}-copia-${i++}`

    const stamp = `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const copied = blocks
      .filter(b => (b.windowId || 'home') === w)
      .map((b, idx) => ({
        ...JSON.parse(JSON.stringify(b)),
        id: `${stamp}-${idx}`,
        windowId: newId,
      }))

    let updated = [...blocks, ...copied]
    const navbar = blocks.find(b => b.type === 'navbar')
    if (navbar) {
      const links = Array.isArray(navbar.content?.links) ? [...navbar.content.links] : []
      updated = updated.map(b => b.id === navbar.id
        ? { ...b, content: { ...navbar.content, links: [...links, { label: `${baseName} (copia)`, windowId: newId, iconName: 'Home' }] } }
        : b)
    }
    updateBlocks(updated)
    persistWindowOrder(updated)
    setPreviewWindow(newId)
  }

  const startRenameWindow = (w: string) => {
    setRenamingWindow(w)
    setRenameValue(windowLabel(w))
  }

  /** Renames a custom window: updates block windowIds + navbar link (id slug and label) */
  const renameWindow = (w: string, commit: boolean) => {
    const name = renameValue.trim()
    setRenamingWindow(null)
    setRenameValue('')
    // commit=false means the user cancelled (Escape or click outside)
    if (!commit || !name || name === windowLabel(w)) return
    const newId = slugify(name) || w
    if (newId === 'home' || newId === w || windows.includes(newId)) return

    const updated = blocks.map(b => {
      if ((b.windowId || 'home') === w) return { ...b, windowId: newId }
      if (b.type === 'navbar' && Array.isArray(b.content?.links)) {
        const links = b.content.links.map((l: any) => l?.windowId === w ? { ...l, windowId: newId, label: name } : l)
        return { ...b, content: { ...b.content, links } }
      }
      return b
    })
    // Only push history if something actually changed (avoids double-push on blur)
    if (!updated.some((b, i) => b !== blocks[i])) return
    updateBlocks(updated)
    persistWindowOrder(updated)
    if (previewWindow === w) setPreviewWindow(newId)
  }

  const requestDeleteWindow = (w: string) => setConfirmDeleteWindow(w)

  const confirmDeleteWindowAction = () => {
    if (!confirmDeleteWindow) return
    deleteWindow(confirmDeleteWindow)
    setConfirmDeleteWindow(null)
  }

  const savePage = async (status?: string) => {
    if (!page) return
    setSaving(true)
    try {
      const body: any = { blocks, title: page.title, slug: page.slug, type: page.type }
      if (siteSettings && Object.keys(siteSettings).length > 0) body.settings = siteSettings
      if (status) body.status = status

      const res = await fetch(`/api/v1/pages/${pageId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data) {
          setPage(data.data)
        }
      }
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    } catch (error) {
      console.error('Error saving page:', error)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 2000)
    }
    finally { setSaving(false) }
  }

  const openPublicView = () => {
    savePage('published')
    window.open(`/p/${pageId}`, '_blank')
  }

  // AI Copilot Prompt Processing — shows a diff preview; user applies or discards
  const handleAISend = async () => {
    if (!inputPrompt.trim() || aiGenerating) return

    const userText = inputPrompt.trim()
    setInputPrompt('')

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setChatMessages(prev => [...prev, userMsg])
    setAiGenerating(true)

    try {
      const res = await fetch('/api/v1/ai/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: page?.title || 'Tienda Moda',
          businessDescription: userText,
          industry: page?.type === 'landing' ? 'marketing digital' : page?.type === 'corporate' ? 'servicios corporativos' : 'fashion',
          pageType: page?.type || 'store',
        }),
      })

      const data = await res.json()
      if (res.ok) {
        const aiBlocks: Block[] = data.data?.blocks || []
        const aiSeo: Record<string, any> = data.data?.seo || {}
        const provider = data.data?.provider
        const model = data.data?.model

        if (aiBlocks.length > 0) {
          setChatMessages(prev => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'ai',
              text: `✨ Generé ${aiBlocks.length} secciones nuevas para tu solicitud. Revisa la vista previa y haz clic en "Aplicar cambios" para reemplazar la página (o "Descartar" para mantener lo actual).`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              blocks: aiBlocks,
              seo: aiSeo,
              provider,
              model,
            },
          ])
        } else {
          setChatMessages(prev => [
            ...prev,
            {
              id: `ai-err-${Date.now()}`,
              sender: 'ai',
              text: 'No pude generar secciones. Verifica que tengas configurado un proveedor de IA (Configuración → IA) o intenta con otra instrucción.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
        }
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            text: data?.error || 'Error al conectar con el proveedor de IA. Revisa la configuración en Configuración → IA.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Ocurrió un error de conexión. Intenta nuevamente en unos segundos.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setAiGenerating(false)
    }
  }

  const applyAIBlocks = (msgId: string) => {
    const msg = chatMessages.find(m => m.id === msgId)
    if (!msg?.blocks || msg.applied) return

    updateBlocks(msg.blocks)

    // Save SEO if provided
    if (msg.seo && page) {
      const body: any = { blocks: msg.blocks, title: page.title, slug: page.slug, type: page.type, seo: msg.seo }
      fetch(`/api/v1/pages/${pageId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      }).catch(() => {})
    }

    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } : m))
  }

  const discardAIBlocks = (msgId: string) => {
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, discarded: true } : m))
  }

  // ── Block-type filter (counts + filtered list) ───────────────────────────
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    blocks.forEach(b => { counts[b.type] = (counts[b.type] || 0) + 1 })
    return counts
  }, [blocks])

  const blockTypesWithCount = useMemo(() =>
    Object.entries(typeCounts).sort((a, b) =>
      b[1] - a[1] || (BLOCK_LABELS[a[0]] || a[0]).localeCompare(BLOCK_LABELS[b[0]] || b[0])),
    [typeCounts])

  const visibleBlocks = useMemo(() => {
    const q = blockSearch.trim().toLowerCase()
    return blocks.filter(b => {
      if (blockFilter && b.type !== blockFilter) return false
      if (!q) return true
      const label = BLOCK_LABELS[b.type] || b.type.replace('-', ' ')
      const name = String((b.content as any)?.title || (b.content as any)?.brandName || '')
      return label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    })
  }, [blocks, blockFilter, blockSearch])

  const blockOrder = useMemo(() => {
    const m = new Map<string, number>()
    blocks.forEach((b, i) => m.set(b.id, i))
    return m
  }, [blocks])

  /** Visible blocks grouped by window, in menu order (respects type/search filters) */
  const groupedBlocks = useMemo(() => {
    const groups = new Map<string, Block[]>()
    visibleBlocks.forEach(b => {
      const w = b.windowId || 'home'
      if (!groups.has(w)) groups.set(w, [])
      groups.get(w)!.push(b)
    })
    const ordered: [string, Block[]][] = []
    orderedWindows.forEach(w => {
      const g = groups.get(w)
      if (g) { ordered.push([w, g]); groups.delete(w) }
    })
    groups.forEach((g, w) => ordered.push([w, g]))
    return ordered
  }, [visibleBlocks, orderedWindows])

  const toggleWindowCollapse = (w: string) => {
    const next = collapsedWindows.includes(w) ? collapsedWindows.filter(x => x !== w) : [...collapsedWindows, w]
    setCollapsedWindows(next)
    writeStored(windowCollapseKey(pageId), JSON.stringify(next))
  }

  // Auto-clear the filter if its type no longer exists on the page
  useEffect(() => {
    if (blockFilter && blocks.length > 0 && !typeCounts[blockFilter]) {
      setBlockFilter('')
      writeStored(blockFilterKey(pageId), '')
    }
  }, [blocks, blockFilter, typeCounts, pageId])

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const selectedConfig = selectedBlock ? blockRegistry.get(selectedBlock.type as any) : undefined

  const deviceWidths = {
    desktop: 'mx-auto',
    tablet: 'mx-auto shadow-2xl rounded-2xl overflow-hidden border border-gray-700 my-4',
    mobile: 'mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-gray-800 my-4',
  }

  /** Canvas preview width in px (0 = fluid %) computed from device + zoom */
  const previewWidthStyle = (): React.CSSProperties => {
    if (device === 'desktop') return { width: `${zoom}%` }
    const base = device === 'tablet' ? 768 : 395
    return { width: `${Math.max(160, Math.round((base * zoom) / 100))}px` }
  }

  /** Auto-fit: computes the zoom that makes the current device frame fully visible (never zooms in past 100%) */
  const fitPreview = (dev: 'desktop' | 'tablet' | 'mobile' = device) => {
    fitManagedRef.current = true
    if (dev === 'desktop') { setZoom(100); return }
    const container = outerScrollRef.current
    if (!container) return
    const available = container.clientWidth - 32 // p-4 = 16px per side
    const base = dev === 'tablet' ? 768 : 395
    setZoom(Math.max(25, Math.min(100, Math.floor((available / base) * 100))))
  }

  /** Switches device and auto-fits the preview so it is fully visible without horizontal scroll */
  const handleDeviceChange = (dev: 'desktop' | 'tablet' | 'mobile') => {
    setDevice(dev)
    fitPreview(dev)
  }

  /** Cycles desktop → tablet → mobile (auto-fitting each time) */
  const cycleDevice = () => {
    const order: ('desktop' | 'tablet' | 'mobile')[] = ['desktop', 'tablet', 'mobile']
    handleDeviceChange(order[(order.indexOf(device) + 1) % order.length]!)
  }

  // Re-run the auto-fit when the canvas area resizes (window resize, panel toggles), but only
  // for zoom values that auto-fit itself set — never override the user's manual zoom.
  const deviceRef = useRef(device)
  deviceRef.current = device
  useEffect(() => {
    const container = outerScrollRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (fitManagedRef.current) fitPreview(deviceRef.current)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])


  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg-base)] overflow-hidden font-sans">
      {/* ═══════════════ TOP BAR ═══════════════ */}
      <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b"
        style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/pages')} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{page?.title || 'Diseñador Visual'}</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-pink-500/10 text-pink-500">Pro Builder</span>
            </div>
            <p className="text-[10px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>/{page?.slug}</p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border)' }}>
          {[
            { mode: 'desktop', icon: Monitor, label: 'Desktop' },
            { mode: 'tablet', icon: Tablet, label: 'Tablet' },
            { mode: 'mobile', icon: Smartphone, label: 'Móvil' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => handleDeviceChange(mode as any)}
              className={`p-1.5 rounded-lg transition-all ${device === mode ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'}`}
              title={label}
            >
              <Icon size={16} />
            </button>
          ))}
          <button
            onClick={cycleDevice}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all border-l"
            style={{ borderColor: 'var(--color-border)' }}
            title="Alternar dispositivo (Desktop → Tablet → Móvil)"
          >
            <RotateCw size={15} />
          </button>
        </div>

        {/* Canvas Zoom */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl border" style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border)' }}>
          <button
            onClick={() => fitPreview()}
            className={`p-1.5 rounded-lg transition-all ${device === 'desktop' || zoom === 100 ? 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]' : 'text-[var(--color-accent)] bg-[var(--color-accent-muted)]'}`}
            title="Ajustar vista al área disponible (auto-fit)"
          >
            <Frame size={15} />
          </button>
          <button
            onClick={() => { fitManagedRef.current = false; setZoom(z => Math.max(25, z - 25)) }}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
            title="Reducir zoom (25%)"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={() => { fitManagedRef.current = false; setZoom(100) }}
            className="text-[10px] font-bold w-9 text-center rounded-lg py-1 hover:bg-[var(--color-bg-hover)] transition-all"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Restablecer zoom (100%)"
          >
            {zoom}%
          </button>
          <button
            onClick={() => { fitManagedRef.current = false; setZoom(z => Math.min(150, z + 25)) }}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
            title="Aumentar zoom (150%)"
          >
            <ZoomIn size={15} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }} title="Deshacer">
            <Undo size={16} />
          </button>
          <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40" style={{ color: 'var(--color-text-secondary)' }} title="Rehacer">
            <Redo size={16} />
          </button>

          <button
            onClick={() => setFullScreen(!fullScreen)}
            className={`p-2 rounded-xl border transition-all ${fullScreen ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]'}`}
            title={fullScreen ? "Salir de Pantalla Completa" : "Pantalla Completa (Ver Canvas Solo)"}
          >
            {fullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${showAIChat ? 'bg-purple-600 text-white shadow-lg' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'}`}
          >
            <Sparkles size={14} /> Copiloto IA
          </button>

          <button
            onClick={() => setShowSiteSettings(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20"
            title="Nombre, logo, colores y WhatsApp del sitio"
          >
            <Settings2 size={14} /> Ajustes del Sitio
          </button>

          <button
            onClick={openPublicView}
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 hover:bg-[var(--color-bg-hover)]"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            title="Ver sitio público en vivo"
          >
            <Eye size={14} className="text-emerald-500" /> Ver Sitio Público
          </button>

          <Button
            size="sm"
            loading={saving}
            icon={savedOk ? <Check size={14} /> : <Save size={14} />}
            onClick={() => savePage('published')}
          >
            {savedOk ? '¡Guardado!' : 'Guardar & Publicar'}
          </Button>
        </div>
      </header>

      {/* ═══════════════ MAIN CANVAS & PANELS ═══════════════ */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Block Library Panel (Hidden in FullScreen) */}
        {!fullScreen && (
          <div className="w-64 border-r flex flex-col shrink-0" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Secciones & Bloques</span>
              <button onClick={() => setShowBlockPicker(true)} className="p-1 text-xs font-bold rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all flex items-center gap-1">
                <Plus size={13} /> Añadir
              </button>
            </div>

            {/* Windows manager */}
            <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  <LayoutGrid size={12} /> Ventanas
                </span>
                <button onClick={() => setAddingWindow(!addingWindow)} className="p-1 text-xs font-bold rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all flex items-center gap-1">
                  <Plus size={13} /> {addingWindow ? 'Cerrar' : 'Nueva'}
                </button>
              </div>
              {addingWindow && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newWindowName}
                    onChange={(e) => setNewWindowName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addWindow()}
                    placeholder="Nombre (ej: Nosotros)"
                    className="input-field text-xs flex-1"
                    autoFocus
                  />
                  <button onClick={addWindow} className="p-1.5 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-80">
                    <Check size={12} />
                  </button>
                </div>
              )}
              {/* Window search */}
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                <input
                  type="text"
                  value={windowSearch}
                  onChange={(e) => { setWindowSearch(e.target.value); writeStored(searchStorageKey(pageId), e.target.value) }}
                  placeholder="Buscar ventana…"
                  className="input-field text-xs pl-7 pr-7 w-full py-1"
                />
                {windowSearch && (
                  <button onClick={() => { setWindowSearch(''); writeStored(searchStorageKey(pageId), '') }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-200 transition-colors" title="Limpiar búsqueda">
                    <X size={11} />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {visibleWindows.map(w => {
                  const count = blocks.filter(b => (b.windowId || 'home') === w).length
                  const isSystem = w === 'catalogo' || w === 'ofertas'
                  const renaming = renamingWindow === w
                  const isDragging = dragWindowId === w
                  const isDropTarget = dragOverWindowId === w && dragWindowId && dragWindowId !== w
                  return (
                    <div
                      key={w}
                      draggable={w !== 'home' && !renaming}
                      onDragStart={(e) => { setDragWindowId(w); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', w) }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverWindowId !== w) setDragOverWindowId(w) }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node) && dragOverWindowId === w) setDragOverWindowId(null) }}
                      onDrop={(e) => { e.preventDefault(); reorderWindow(dragWindowId || '', w) }}
                      onDragEnd={() => { setDragWindowId(null); setDragOverWindowId(null) }}
                      className={`flex items-center justify-between gap-1 px-2 py-1 rounded-lg transition-all ${previewWindow === w ? 'bg-[var(--color-accent-muted)]' : 'hover:bg-[var(--color-bg-hover)]'} ${isDragging ? 'opacity-40' : ''} ${isDropTarget ? 'ring-2 ring-sky-500/70 shadow-sm' : ''} ${w !== 'home' && !renaming ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      {w !== 'home' && !renaming && (
                        <GripVertical size={12} className="shrink-0 text-[var(--color-text-tertiary)] opacity-40" />
                      )}
                      {renaming ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Home size={11} className="shrink-0 text-[var(--color-text-tertiary)]" />
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renameWindow(w, true)
                              if (e.key === 'Escape') renameWindow(w, false)
                            }}
                            onBlur={() => renameWindow(w, false)}
                            className="input-field text-xs flex-1 min-w-0 py-0.5 px-1.5"
                            placeholder="Nuevo nombre"
                            autoFocus
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={() => renameWindow(w, true)} className="p-0.5 text-emerald-500 hover:opacity-80 transition-colors" title="Guardar nombre">
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setPreviewWindow(w)} className="flex items-center gap-1.5 text-xs font-semibold flex-1 min-w-0 text-left" style={{ color: previewWindow === w ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                          <Home size={11} className="shrink-0" />
                          <span className="truncate">{windowLabel(w)}</span>
                          <span className="text-[10px] opacity-60">{count}</span>
                        </button>
                      )}
                      {!renaming && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {w !== 'home' && !isSystem && (
                            <button onClick={() => startRenameWindow(w)} className="p-0.5 text-gray-400 hover:text-amber-500 transition-colors" title="Renombrar ventana">
                              <Pencil size={11} />
                            </button>
                          )}
                          <button onClick={() => duplicateWindow(w)} className="p-0.5 text-gray-400 hover:text-sky-500 transition-colors" title="Duplicar ventana (copia sus secciones y añade enlace al menú)">
                            <Copy size={11} />
                          </button>
                          {w !== 'home' && (
                            <button onClick={() => requestDeleteWindow(w)} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar ventana y sus secciones">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {visibleWindows.length === 0 && (
                  <p className="text-[10px] text-center text-[var(--color-text-tertiary)] py-2">
                    Sin ventanas que coincidan con “{windowSearch}”
                  </p>
                )}
                {dragWindowId && dragWindowId !== 'home' && !windowSearch && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                    onDrop={(e) => { e.preventDefault(); reorderWindow(dragWindowId || '', '__end__') }}
                    className="mt-1 rounded-lg border border-dashed text-[10px] text-center py-1.5 text-[var(--color-text-tertiary)] transition-colors"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    Soltar aquí para mover al final del menú
                  </div>
                )}
              </div>
            </div>

            {/* Block-type filter with counts */}
            <div className="px-3 pb-2 border-b space-y-1.5" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5">
                <Sliders size={12} className="shrink-0 text-[var(--color-text-tertiary)]" />
                <select
                  value={blockFilter}
                  onChange={(e) => { setBlockFilter(e.target.value); writeStored(blockFilterKey(pageId), e.target.value) }}
                  className="select-field text-xs flex-1 min-w-0 py-1"
                  title="Filtrar por tipo de bloque"
                >
                  <option value="">Todos los bloques ({blocks.length})</option>
                  {blockTypesWithCount.map(([type, count]) => (
                    <option key={type} value={type}>{BLOCK_LABELS[type] || type.replace('-', ' ')} ({count})</option>
                  ))}
                </select>
                {blockFilter && (
                  <button
                    onClick={() => { setBlockFilter(''); writeStored(blockFilterKey(pageId), '') }}
                    className="p-1 text-gray-400 hover:text-gray-200 transition-colors shrink-0"
                    title="Limpiar filtro"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => { setCollapsedWindows([]); writeStored(windowCollapseKey(pageId), '[]') }}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors shrink-0"
                  title="Expandir todas las ventanas"
                >
                  <ChevronsDown size={13} />
                </button>
                <button
                  onClick={() => { setCollapsedWindows([...orderedWindows]); writeStored(windowCollapseKey(pageId), JSON.stringify([...orderedWindows])) }}
                  className="p-1 text-gray-400 hover:text-gray-200 transition-colors shrink-0"
                  title="Colapsar todas las ventanas"
                >
                  <ChevronsUp size={13} />
                </button>
              </div>
              {/* Text search by block name or type */}
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                <input
                  type="text"
                  value={blockSearch}
                  onChange={(e) => { setBlockSearch(e.target.value); writeStored(blockSearchKey(pageId), e.target.value) }}
                  placeholder="Buscar por nombre o tipo…"
                  className="input-field text-xs pl-7 pr-7 w-full py-1"
                />
                {blockSearch && (
                  <button
                    onClick={() => { setBlockSearch(''); writeStored(blockSearchKey(pageId), '') }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              {(blockFilter || blockSearch.trim()) && visibleBlocks.length > 0 && (
                <p className="text-[9px] font-bold text-[var(--color-text-tertiary)]">
                  {visibleBlocks.length} de {blocks.length} secciones
                  {blockFilter ? ` · ${BLOCK_LABELS[blockFilter] || blockFilter.replace('-', ' ')}` : ''}
                  {blockSearch.trim() ? ` · «${blockSearch.trim()}»` : ''}
                </p>
              )}
            </div>

            <div ref={blocksListRef} onScroll={handleBlocksListScroll} className="flex-1 overflow-y-auto p-2 space-y-1">
              {groupedBlocks.map(([w, groupBlocks]) => {
                const isCollapsed = collapsedWindows.includes(w)
                const hasGroupSelection = !!selectedBlock && (selectedBlock.windowId || 'home') === w
                return (
                  <div key={w} className="space-y-1">
                    <div
                      className={`flex items-center gap-1 rounded-lg transition-all ${dragOverWindowHeader === w ? 'ring-2 ring-sky-500/70 bg-sky-500/10' : ''}`}
                      onDragOver={(e) => {
                        const payload = readDragPayload(e)
                        if (!payload) return
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverWindowHeader(w)
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        setDragOverWindowHeader(null)
                        const payload = readDragPayload(e)
                        if (!payload) return
                        handleDropOnWindow(payload, w)
                      }}
                      onDragLeave={(e) => {
                        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOverWindowHeader(null)
                      }}
                      title="Suelta un bloque aquí para moverlo a esta ventana"
                    >
                      <button
                        onClick={() => toggleWindowCollapse(w)}
                        className={`flex-1 min-w-0 flex items-center justify-between px-1.5 py-1 rounded-lg transition-colors ${hasGroupSelection ? 'bg-[var(--color-accent-muted)]' : 'hover:bg-[var(--color-bg-hover)]'}`}
                        title={isCollapsed ? `Expandir ventana ${windowLabel(w)}` : `Colapsar ventana ${windowLabel(w)}`}
                      >
                        <span className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider truncate ${hasGroupSelection ? 'text-[var(--color-accent)]' : ''}`} style={hasGroupSelection ? undefined : { color: 'var(--color-text-tertiary)' }}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasGroupSelection ? 'bg-[var(--color-accent)]' : 'bg-transparent'}`} />
                          <ChevronDown size={12} className={`shrink-0 transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`} />
                          {windowLabel(w)}
                        </span>
                        <span className={`text-[9px] font-bold shrink-0 ${hasGroupSelection ? 'text-[var(--color-accent)]' : ''}`} style={hasGroupSelection ? undefined : { color: 'var(--color-text-tertiary)' }}>{groupBlocks.length}</span>
                      </button>
                      <button
                        onClick={() => setPreviewWindow(w)}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${previewWindow === w ? 'text-[var(--color-accent)] bg-[var(--color-accent-muted)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'}`}
                        title={`Ver la ventana «${windowLabel(w)}» en el canvas`}
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                    {!isCollapsed && groupBlocks.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBlockId(b.id)}
                        data-block-id={b.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragPayload(e, { kind: 'top', blockId: b.id }); setDragBlockId(b.id) }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverBlockId(b.id) }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const payload = readDragPayload(e)
                          if (!payload) return
                          if (payload.kind === 'nested') handlePromoteNestedBlock(payload.parentId, payload.blockId, b.id)
                          else handleDropBlock(payload.blockId, b.id)
                        }}
                        onDragLeave={(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOverBlockId(null) }}
                        onDragEnd={() => { setDragBlockId(null); setDragOverBlockId(null) }}
                        className={`p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all flex items-center justify-between ${selectedBlockId === b.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] shadow-sm' : 'border-transparent hover:bg-[var(--color-bg-hover)]'} ${flashBlockId === b.id ? 'ring-2 ring-purple-500/60' : ''} ${dragBlockId === b.id ? 'opacity-40' : ''} ${dragOverBlockId === b.id ? 'ring-2 ring-sky-500/70 shadow-sm' : ''}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold w-4 text-[var(--color-text-tertiary)]">{(blockOrder.get(b.id) ?? 0) + 1}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold capitalize truncate block" style={{ color: 'var(--color-text-primary)' }}>{b.type.replace('-', ' ')}</span>
                            <span className="text-[9px] font-bold" style={{ color: 'var(--color-text-tertiary)' }}>{(b.windowId || 'home') === 'home' ? '🏠 Inicio' : (b.windowId || 'home')}</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.id) }} className="p-1 hover:text-red-500 transition-all text-gray-400">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {visibleBlocks.length === 0 && (
                <p className="text-[10px] text-center text-[var(--color-text-tertiary)] py-3 px-2 leading-relaxed">
                  {blockSearch.trim()
                    ? <>Sin bloques que coincidan con «{blockSearch.trim()}»</>
                    : blockFilter
                      ? <>Sin bloques de tipo «{BLOCK_LABELS[blockFilter] || blockFilter.replace('-', ' ')}»</>
                      : 'Aún no hay bloques. Añade tu primera sección.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Center column: canvas + status bar */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Center Frame Render — renders the REAL public store component inline (100% parity with /p/[id]) */}
          <div ref={outerScrollRef} onScroll={handleCanvasScroll} className="flex-1 bg-slate-900/10 overflow-auto flex p-4">
            <div className={`transition-all duration-300 ${deviceWidths[device]}`} style={previewWidthStyle()}>
              {/* Same fonts as the public site so the canvas renders pixel-identical */}
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap" />
              <style>{`
                .editor-block { position: relative; cursor: pointer; }
                .editor-block:hover { outline: 2px dashed rgba(236,72,153,0.55); outline-offset: -2px; }
                .editor-block-selected { outline: 3px solid #a855f7 !important; outline-offset: -3px !important; box-shadow: 0 0 0 6px rgba(168,85,247,0.18) !important; }
                .editor-block-dragging { opacity: 0.4; }
                .editor-block-drop-target { outline: 2px solid #0ea5e9 !important; outline-offset: -2px !important; box-shadow: 0 0 0 5px rgba(14,165,233,0.22) !important; cursor: copy; }
              `}</style>
              <PublicStoreClient
                pageTitle={page?.title || ''}
                blocks={blocks}
                settings={siteSettings}
                seo={page?.seo}
                pageId={pageId}
                editorMode
                controlledWindow={previewWindow}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(blockId) => {
                  if (selectedBlockIdRef.current !== blockId) {
                    selectedBlockIdRef.current = blockId
                    scrollRetryRef.current = 0
                    scrollToSelectedRef.current = true
                    setSelectedBlockId(blockId)
                  }
                }}
                onNavigateWindow={(windowId) => setPreviewWindow(windowId)}
                onCanvasBlockDrop={(parentId, colIdx, beforeNbId, payload) => handleCanvasBlockDrop(parentId, colIdx, beforeNbId, payload)}
              />
              {blocks.length === 0 && (
                <div className="py-24 text-center text-sm font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                  Canvas vacío. Haz clic en «+ Agregar Bloque» o usa el Copiloto de IA para comenzar.
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════ CANVAS STATUS BAR ═══════════════ */}
          <div className="h-9 shrink-0 border-t flex items-center gap-2 px-3 overflow-x-auto" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            {/* Active window with quick switcher */}
            <div className="flex items-center gap-1.5 shrink-0">
              <LayoutGrid size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">Ventana:</span>
              <select
                value={previewWindow}
                onChange={(e) => setPreviewWindow(e.target.value)}
                className="select-field text-[10px] font-bold py-0.5 px-1 max-w-[120px]"
                title="Ir a otra ventana del sitio"
              >
                {orderedWindows.map(w => (
                  <option key={w} value={w}>{windowLabel(w)}</option>
                ))}
              </select>
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">
                {blocks.filter(b => (b.windowId || 'home') === previewWindow).length}
              </span>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Device with cycle action */}
            <div className="flex items-center gap-1.5 shrink-0">
              {device === 'desktop' ? <Monitor size={12} className="text-[var(--color-text-tertiary)]" /> : device === 'tablet' ? <Tablet size={12} className="text-[var(--color-text-tertiary)]" /> : <Smartphone size={12} className="text-[var(--color-text-tertiary)]" />}
              <span className="text-[10px] font-bold capitalize" style={{ color: 'var(--color-text-secondary)' }}>{device}</span>
              <button onClick={cycleDevice} className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" title="Alternar dispositivo (auto-fit)">
                <RotateCw size={11} />
              </button>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Zoom quick actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => fitPreview()} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" title="Ajustar al área disponible">
                <Frame size={12} />
              </button>
              <button onClick={() => { fitManagedRef.current = false; setZoom(z => Math.max(25, z - 25)) }} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" title="Reducir zoom">
                <ZoomOut size={12} />
              </button>
              <span className="text-[10px] font-bold w-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>{zoom}%</span>
              <button onClick={() => { fitManagedRef.current = false; setZoom(z => Math.min(150, z + 25)) }} className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" title="Aumentar zoom">
                <ZoomIn size={12} />
              </button>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Deshacer (Ctrl+Z)"
              >
                <Undo size={12} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Rehacer (Ctrl+Shift+Z)"
              >
                <Redo size={12} />
              </button>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Block counts */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <Layers size={12} className="text-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-secondary)' }}>{blocks.length} secciones</span>
              <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">
                · {blocks.filter(b => (b.windowId || 'home') === previewWindow).length} en {windowLabel(previewWindow)}
              </span>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Publish status badge + quick save/publish */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${page?.status === 'published' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-600 bg-amber-500/10 border-amber-500/30'}`}
                title={page?.status === 'published' ? 'Esta página está publicada y visible en el sitio' : 'Esta página aún no está publicada'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${page?.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'} ${saving ? 'animate-pulse' : ''}`} />
                {page?.status === 'published' ? 'Publicado' : 'Borrador'}
              </span>
              <button
                onClick={() => savePage(page?.status === 'published' ? undefined : 'published')}
                disabled={saving}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border transition-all disabled:opacity-50 ${page?.status === 'published' ? 'hover:bg-[var(--color-bg-hover)]' : 'text-white border-transparent hover:opacity-90'}`}
                style={page?.status === 'published' ? { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' } : { background: 'var(--color-accent)' }}
                title={page?.status === 'published' ? 'Guardar los cambios actuales' : 'Guardar y publicar la página'}
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : savedOk ? <Check size={11} className={page?.status === 'published' ? 'text-emerald-500' : ''} /> : page?.status === 'published' ? <Save size={11} /> : <Rocket size={11} />}
                {page?.status === 'published' ? (savedOk ? 'Guardado' : 'Guardar') : 'Publicar'}
              </button>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* View public site */}
            <button
              onClick={openPublicView}
              className="flex items-center gap-1.5 shrink-0 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-[var(--color-bg-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Guardar y ver el sitio público en vivo"
            >
              <Eye size={12} className="text-emerald-500" />
              <span className="hidden lg:inline">Ver sitio</span>
            </button>
          </div>
        </div>

        {/* Right Inspector Panel (Hidden in FullScreen) */}
        {!fullScreen && selectedBlock && selectedConfig && (
          <BlockEditor
            block={selectedBlock}
            blockConfig={selectedConfig}
            windows={windows}
            onChange={(s, c) => handleUpdateBlock(selectedBlock.id, s, c)}
            onWindowChange={(w) => handleWindowChange(selectedBlock.id, w)}
            onMove={(dir) => handleMoveBlock(selectedBlock.id, dir)}
            onDuplicate={() => handleDuplicateBlock(selectedBlock.id)}
            onDelete={() => handleDeleteBlock(selectedBlock.id)}
            onPromoteNestedBlock={(parentId, nestedId, targetTopId) => handlePromoteNestedBlock(parentId, nestedId, targetTopId)}
            onDemoteBlock={(blockId, parentId, colIdx, beforeNbId) => handleDemoteBlock(blockId, parentId, colIdx, beforeNbId)}
          />
        )}

        {/* ═══════════════ AI COPILOT CHAT DRAWER ═══════════════ */}
        {showAIChat && (
          <div className="w-88 border-l flex flex-col shrink-0 shadow-2xl z-30 animate-fade-in" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}>
            <div className="p-3.5 border-b flex items-center justify-between bg-purple-600 text-white">
              <div className="flex items-center gap-2">
                <Bot size={18} />
                <span className="font-extrabold text-xs">Copiloto IA de Diseño</span>
              </div>
              <button onClick={() => setShowAIChat(false)} className="p-1 rounded hover:bg-white/10 text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-[var(--color-bg-base)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-none'}`}>
                    <p>{msg.text}</p>

                    {/* Provider badge */}
                    {msg.provider && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[9px] font-bold uppercase tracking-wide">
                        <Sparkles size={9} /> {msg.provider}{msg.model ? ` · ${msg.model}` : ''}
                      </div>
                    )}

                    {/* AI-generated blocks diff preview */}
                    {msg.blocks && msg.blocks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Secciones generadas ({msg.blocks.length})</p>
                        {msg.blocks.map((b, i) => {
                          const label = BLOCK_LABELS[b.type] || b.type.replace('-', ' ')
                          const title = (b.content as any)?.title || (b.content as any)?.brandName || ''
                          const exists = !!b.id && blocks.some(x => x.id === b.id)
                          return (
                            <div
                              key={b.id || i}
                              onClick={() => {
                                if (exists && b.id) {
                                  scrollToSelectedRef.current = true
                                  setSelectedBlockId(b.id)
                                }
                              }}
                              className={`flex items-center gap-2 p-1.5 rounded-lg bg-[var(--color-bg-hover)] border transition-colors ${exists ? 'cursor-pointer hover:border-purple-500/50' : 'border-[var(--color-border)]'}`}
                              title={exists ? 'Ver en el editor' : 'Aplica los cambios para poder editarla'}
                            >
                              <span className="text-[9px] font-bold text-purple-500 w-4">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold capitalize truncate">{label}</p>
                                {title && <p className="text-[9px] text-[var(--color-text-tertiary)] truncate">{String(title)}</p>}
                              </div>
                            </div>
                          )
                        })}

                        {/* Apply / Discard actions */}
                        {!msg.applied && !msg.discarded ? (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => applyAIBlocks(msg.id)}
                              className="flex-1 py-1.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-700 transition-all"
                            >
                              <Check size={11} className="inline mr-1" />Aplicar cambios
                            </button>
                            <button
                              onClick={() => discardAIBlocks(msg.id)}
                              className="flex-1 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-bold hover:bg-[var(--color-bg-hover)] transition-all"
                            >
                              <X size={11} className="inline mr-1" />Descartar
                            </button>
                          </div>
                        ) : msg.applied ? (
                          <p className="pt-1 text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                            <Check size={11} /> Aplicado al lienzo — puedes guardar con "Guardar & Publicar"
                          </p>
                        ) : (
                          <p className="pt-1 text-[9px] font-bold text-gray-500">Descartado</p>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] opacity-60 block mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {aiGenerating && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs flex items-center gap-2 text-purple-500">
                    <Sparkles size={14} className="animate-spin" />
                    <span>Generando cambios con IA...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Prompt */}
            <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                  placeholder="Ej: Agrega catálogo de ropa de invierno..."
                  className="input-field text-xs flex-1"
                />
                <button onClick={handleAISend} disabled={aiGenerating || !inputPrompt.trim()} className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════ SITE SETTINGS MODAL (logo, marca, colores) ═══════════════ */}
      {showSiteSettings && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-5 surface-card shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-indigo-500" />
                <h3 className="text-sm font-bold">Ajustes del Sitio</h3>
              </div>
              <button onClick={() => setShowSiteSettings(false)} className="p-1 text-gray-400 hover:text-gray-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="form-label text-[11px] font-bold">Nombre del Sitio / Marca</label>
                <input
                  type="text"
                  value={siteSettings.siteName || ''}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  className="input-field text-xs font-semibold"
                  placeholder="Mi Tienda Premium"
                />
              </div>

              <ImageUploadField
                label="Logo del sitio (sube desde tu dispositivo)"
                value={siteSettings.logoUrl || ''}
                onChange={(v) => setSiteSettings({ ...siteSettings, logoUrl: v })}
                previewClass="h-14 w-auto"
                placeholder="https://.../logo.png"
              />

              <ImageUploadField
                label="Favicon (.png / .ico)"
                value={siteSettings.faviconUrl || ''}
                onChange={(v) => setSiteSettings({ ...siteSettings, faviconUrl: v })}
                previewClass="h-10 w-10"
                placeholder="https://.../favicon.png"
              />

              <div>
                <label className="form-label text-[11px] font-bold">WhatsApp / Teléfono de pedidos</label>
                <input
                  type="text"
                  value={siteSettings.whatsappNumber || ''}
                  onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                  className="input-field text-xs font-mono"
                  placeholder="51999888777"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'primaryColor', label: 'Color Primario' },
                  { key: 'secondaryColor', label: 'Color Secundario' },
                  { key: 'accentColor', label: 'Color Acento' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="form-label text-[11px] font-bold">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={siteSettings[key] || '#2563eb'}
                        onChange={(e) => setSiteSettings({ ...siteSettings, [key]: e.target.value })}
                        className="w-8 h-8 rounded-lg border cursor-pointer shrink-0"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <input
                        type="text"
                        value={siteSettings[key] || ''}
                        onChange={(e) => setSiteSettings({ ...siteSettings, [key]: e.target.value })}
                        className="input-field text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed">
                El logo, nombre y colores se aplican en todo el sitio público (barra de navegación, pie de página y secciones).
                Guarda con <b>Guardar &amp; Publicar</b> para publicar los cambios.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setShowSiteSettings(false)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border hover:bg-[var(--color-bg-hover)] transition-all"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cerrar
              </button>
              <Button size="sm" onClick={() => { setShowSiteSettings(false); savePage('published') }}>
                Guardar y Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ WINDOW DELETE CONFIRMATION MODAL ═══════════════ */}
      {confirmDeleteWindow && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border p-5 surface-card shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <h3 className="text-sm font-bold">Eliminar ventana</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              ¿Seguro que deseas eliminar la ventana{' '}
              <b style={{ color: 'var(--color-text-primary)' }}>"{windowLabel(confirmDeleteWindow)}"</b>?
              Se eliminarán sus{' '}
              <b style={{ color: 'var(--color-text-primary)' }}>{blocks.filter(b => (b.windowId || 'home') === confirmDeleteWindow).length} secciones</b>{' '}
              y el enlace del menú. Esta acción no se puede deshacer.
            </p>
            {confirmDeleteWindow === previewWindow && (
              <p className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5">
                <AlertTriangle size={11} /> Es la ventana activa en el lienzo — al eliminarla volverás a Inicio.
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteWindow(null)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border hover:bg-[var(--color-bg-hover)] transition-all"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteWindowAction}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ WINDOW MOVE CONFIRMATION MODAL (product content) ═══════════════ */}
      {confirmMoveWindow && (() => {
        const affected = findBlockAnywhere(confirmMoveWindow.payload.blockId)
        const sourceWindow = windowLabel(affected?.windowId || 'home')
        const targetWindow = windowLabel(confirmMoveWindow.targetWindow)
        return (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border p-5 surface-card shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-amber-500 shrink-0" />
                <h3 className="text-sm font-bold">Mover bloque con contenido de producto</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Este bloque pertenece a la ventana de producto{' '}
                <b style={{ color: 'var(--color-text-primary)' }}>"{sourceWindow}"</b>
                {confirmMoveWindow.targetWindow.startsWith('product:') && (
                  <> y lo estás moviendo a la landing del producto{' '}
                    <b style={{ color: 'var(--color-text-primary)' }}>"{targetWindow}"</b></>
                )}
                . Si lo mueves a{' '}
                <b style={{ color: 'var(--color-text-primary)' }}>"{targetWindow}"</b>
                , ese contenido dejará de verse en la página del producto actual. Puedes deshacer con Ctrl+Z.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setConfirmMoveWindow(null)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border hover:bg-[var(--color-bg-hover)] transition-all"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmMoveWindowAction}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all flex items-center gap-1.5"
                >
                  <MoveRight size={12} /> Mover de todas formas
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border p-5 surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Añadir Nueva Sección</h3>
              <button onClick={() => setShowBlockPicker(false)} className="p-1 text-gray-400 hover:text-gray-200">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: 'hero', name: 'Hero Banner', desc: 'Encabezado principal con título y CTA' },
                { type: 'product-grid', name: 'Catálogo Productos', desc: 'Parrilla de productos con precios' },
                { type: 'features', name: 'Beneficios', desc: 'Grid de características con íconos' },
                { type: 'testimonials', name: 'Testimonios', desc: 'Opiniones de clientes' },
                { type: 'cta', name: 'Llamado a Acción', desc: 'Banner de oferta y conversión' },
                { type: 'footer', name: 'Pie de Página', desc: 'Copyright y enlaces' },
              ].map(item => (
                <div key={item.type} onClick={() => handleAddBlock(item.type)} className="p-3 rounded-xl border border-gray-700 hover:border-pink-500 hover:bg-pink-500/5 cursor-pointer transition-all">
                  <h4 className="font-bold text-xs">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
