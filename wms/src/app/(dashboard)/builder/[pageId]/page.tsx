'use client'

import { useState, useEffect, useCallback, useMemo, useRef, use } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Save, Eye, ArrowLeft, ArrowUp, ArrowDown, Undo, Redo, Plus, Monitor, Tablet, Smartphone,
  Wand2, Check, Sparkles, X, Send, Bot, Layers, Sliders, Maximize2, Minimize2, ExternalLink,
  Settings2, LayoutGrid, Trash2, Home, FilePlus2, Pencil, Copy, AlertTriangle, GripVertical, Search, ChevronDown, ChevronsDown, ChevronsUp, ZoomIn, ZoomOut, RotateCw, Frame, Rocket, Loader2, ShoppingBag, MoveRight, Edit3, CornerUpLeft, Undo2, Focus, Link2, Image as ImageIcon, FileText, Users, Scissors, ClipboardPaste, Command, Keyboard
} from 'lucide-react'
import { Block, blockRegistry } from '@repo/blocks'
import BlockEditor from '@/components/builder/BlockEditor'
import ImageUploadField from '@/components/builder/ImageUploadField'
import PublicStoreClient from '@/components/public/PublicStoreClient'
import { Button } from '@/components/ui/Button'
import { neighborBlockEl } from '@/lib/block-list-nav'
import { reorderLinksByStoredOrder, windowIdsFromLinks } from '@/lib/window-order'
import { moveBlockTo, promoteNestedBlock, demoteBlock, moveBlockToWindow, promoteNestedBlockToWindow, blockHasProductContent, moveNestedBetweenColumns } from '@/lib/block-order'
import { FONT_OPTIONS, googleFontsHref } from '@/lib/fonts'
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
const clipboardKey = 'builder:clipboard'

function readStored(key: string): string | null {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null } catch { return null }
}
function writeStored(key: string, value: string) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value) } catch { /* ignore */ }
}

/** Sets a (possibly nested, `products:2:name`) content field on a block, handling blocks nested inside columns. */
function applyInlineEdit(blocksList: Block[], blockId: string, field: string, value: string): Block[] {
  const parts = field.split(':')
  const setField = (block: Block): Block => {
    const content = JSON.parse(JSON.stringify(block.content || {}))
    let obj: any = content
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!
      if (typeof obj[key] !== 'object' || obj[key] === null) {
        obj[key] = /^\d+$/.test(parts[i + 1] || '') ? [] : {}
      }
      obj = obj[key]
    }
    obj[parts[parts.length - 1]!] = value
    return { ...block, content }
  }
  return blocksList.map(b => {
    if (b.id === blockId) return setField(b)
    if (b.type === 'columns') {
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      let changed = false
      const next = items.map(col => {
        const colBlocks = Array.isArray(col?.blocks) ? col.blocks : []
        if (!colBlocks.some((x: any) => x.id === blockId)) return col
        changed = true
        return { ...col, blocks: colBlocks.map((x: any) => (x.id === blockId ? setField(x) : x)) }
      })
      return changed ? { ...b, content: { ...b.content, items: next } } : b
    }
    return b
  })
}

export default function BuilderPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params)
  const router = useRouter()

  const [page, setPage] = useState<PageData | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  /** Canvas deep-select: exact field inside the selected block (logoUrl, buttonText, products:2:name…). */
  const [selectedField, setSelectedField] = useState<string | null>(null)
  /** Canvas inline text editing: which block/field is being edited directly on the canvas. */
  const [inlineEdit, setInlineEdit] = useState<{ blockId: string; field: string } | null>(null)
  const inlineEditRef = useRef<{ blockId: string; field: string; startValue: string } | null>(null)
  /** Context menu opened with right-click on a canvas element. */
  const [contextMenu, setContextMenu] = useState<{ blockId: string; field: string | null; x: number; y: number; imageUrl?: string | null } | null>(null)
  /** Última sustitución de imagen en el canvas (para 'Deshacer reemplazo' del menú contextual). */
  const lastImageReplacementRef = useRef<{ blockId: string; field: string; previousUrl: string } | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
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
  /** Modo insertar del picker: bloque ante el cual insertar (null = al final). */
  const [insertTarget, setInsertTarget] = useState<{ beforeBlockId: string | null } | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('')
  const pickerAllBlocks = useMemo(() => blockRegistry.getAll(), [])
  const [showAIChat, setShowAIChat] = useState(false)
  const [blockFilter, setBlockFilter] = useState('')
  const [blockSearch, setBlockSearch] = useState('')
  const [collapsedWindows, setCollapsedWindows] = useState<string[]>([])

  // Multi-window canvas + site settings
  const [previewWindow, setPreviewWindow] = useState<string>('home')
  const [showSiteSettings, setShowSiteSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
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

  // ── Clipboard (copy/cut/paste sections) ─────────────────────────────────
  const [clipboardBlock, setClipboardBlock] = useState<Block | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Command palette (Ctrl+K) ───────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [paletteIdx, setPaletteIdx] = useState(0)

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SELECT_BLOCK' && e.data.blockId) {
        if (selectedBlockIdRef.current !== e.data.blockId) {
          selectedBlockIdRef.current = e.data.blockId
          scrollRetryRef.current = 0
          scrollToSelectedRef.current = true
          setSelectedBlockId(e.data.blockId)
          setSelectedField(null)
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

  // Restore the persisted clipboard (sections survive reloads, even across pages)
  useEffect(() => {
    const raw = readStored(clipboardKey)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') setClipboardBlock(parsed)
      } catch { /* ignore */ }
    }
  }, [])

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

  // Close the canvas context menu on outside interaction (click, scroll, resize, Escape)
  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null) }
    window.addEventListener('mousedown', close)
    window.addEventListener('wheel', close, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('wheel', close)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
    }
  }, [contextMenu])

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
    // Insert mode: coloca el bloque justo antes del objetivo (o al final).
    const target = insertTarget
    setInsertTarget(null)
    let updated: Block[]
    if (target?.beforeBlockId) {
      const idx = blocks.findIndex(b => b.id === target.beforeBlockId)
      if (idx >= 0) {
        updated = [...blocks.slice(0, idx), newBlock, ...blocks.slice(idx)]
      } else {
        updated = [...blocks, newBlock]
      }
    } else {
      updated = [...blocks, newBlock]
    }
    updateBlocks(updated)
    setSelectedBlockId(newBlock.id)
    setShowBlockPicker(false)
  }

  /** Abre el picker en modo insertar (desde el handle '+' del canvas). */
  const handleInsertBetween = (beforeBlockId: string | null) => {
    setInsertTarget({ beforeBlockId })
    setShowBlockPicker(true)
  }

  /** Abre el picker en modo añadir (al final de la ventana activa). */
  const openAddBlockPicker = () => {
    setInsertTarget(null)
    setShowBlockPicker(true)
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

  // ── Clipboard: copy / cut / paste sections (Ctrl+C, Ctrl+X, Ctrl+V) ────
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2600)
  }

  const blockTypeLabel = (type: string) =>
    BLOCK_LABELS[type] || blockRegistry.get(type as any)?.name || type.replace('-', ' ')

  const handleCopyBlock = (id: string | null) => {
    if (!id) { showToast('Selecciona una sección primero (clic en el lienzo o en la lista)'); return }
    const b = blocks.find(x => x.id === id)
    if (!b) return
    const clone = JSON.parse(JSON.stringify(b))
    setClipboardBlock(clone)
    writeStored(clipboardKey, JSON.stringify(clone))
    showToast(`Sección copiada: ${blockTypeLabel(b.type)}`)
  }

  const handleCutBlock = (id: string | null) => {
    if (!id) { showToast('Selecciona una sección primero'); return }
    handleCopyBlock(id)
    handleDeleteBlock(id)
    showToast('Sección cortada — pégala con Ctrl+V')
  }

  const handlePasteBlock = () => {
    if (!clipboardBlock) { showToast('Portapapeles vacío — copia una sección con Ctrl+C'); return }
    const fresh: Block = {
      ...JSON.parse(JSON.stringify(clipboardBlock)),
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      // Al pegar, la sección aterriza en la ventana activa del lienzo
      windowId: previewWindow,
    }
    const selIdx = selectedBlockId ? blocks.findIndex(b => b.id === selectedBlockId) : -1
    const updated = selIdx >= 0
      ? [...blocks.slice(0, selIdx + 1), fresh, ...blocks.slice(selIdx + 1)]
      : [...blocks, fresh]
    updateBlocks(updated)
    setSelectedBlockId(fresh.id)
    setPreviewWindow(previewWindow)
    showToast(`Sección pegada: ${blockTypeLabel(fresh.type)}`)
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

  /** Finds the `columns` parent of a nested block, if any. */
  const findNestedParent = (blockId: string): string | null => {
    for (const b of blocks) {
      if (b.type !== 'columns') continue
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      for (const col of items) {
        if ((Array.isArray(col?.blocks) ? col.blocks : []).some((x: any) => x.id === blockId)) return b.id
      }
    }
    return null
  }

  /** Closes the canvas context menu (click anywhere, Escape, scroll, resize or selection change). */
  const closeContextMenu = () => setContextMenu(null)

  /** Opens the context menu for the right-clicked canvas element (imageUrl when the element is an image). */
  const handleBlockContextMenu = (blockId: string, field: string | null, x: number, y: number, imageUrl?: string | null) => {
    setContextMenu({ blockId, field, x, y, imageUrl: imageUrl || null })
  }

  /** Friendly label for a canvas field key (logoUrl → 'logo', products:2:name → 'nombre · elemento 3'). */
  const fieldLabel = (f: string): string => {
    const parts = f.split(':')
    const base = parts[parts.length - 1] || ''
    const names: Record<string, string> = {
      logoUrl: 'logo', brandName: 'marca', announcement: 'anuncio', badge: 'etiqueta', title: 'título',
      subtitle: 'subtítulo', text: 'texto', description: 'descripción', buttonText: 'botón principal',
      secondaryButtonText: 'botón secundario', heroImage: 'imagen de fondo', src: 'imagen', caption: 'pie de foto',
      imageUrl: 'imagen', thumbnailUrl: 'portada', ctaText: 'botón', address: 'dirección', phone: 'teléfono',
      email: 'correo', companyName: 'nombre de la marca', tagline: 'frase', name: 'nombre', price: 'precio',
      role: 'cargo', question: 'pregunta', videoUrl: 'video', hours: 'horarios', headline: 'titular',
    }
    const label = names[base] || base.replace(/([A-Z])/g, ' $1').toLowerCase()
    if (parts.length === 3) return `${label} · elemento ${parseInt(parts[1]!, 10) + 1}`
    return label
  }

  /** Canvas deep-select: an inner element (logo, button, image…) was clicked. Select its block
   *  and tell the inspector which exact field to focus. Nested blocks map to their `columns` parent. */
  const handleSelectElement = (blockId: string, field: string) => {
    const top = blocks.find(b => b.id === blockId)
    if (top) {
      selectedBlockIdRef.current = blockId
      scrollRetryRef.current = 0
      scrollToSelectedRef.current = true
      setSelectedBlockId(blockId)
      setSelectedField(field)
      return
    }
    for (const b of blocks) {
      if (b.type !== 'columns') continue
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      for (const col of items) {
        if ((Array.isArray(col?.blocks) ? col.blocks : []).some((x: any) => x.id === blockId)) {
          selectedBlockIdRef.current = b.id
          scrollRetryRef.current = 0
          scrollToSelectedRef.current = true
          setSelectedBlockId(b.id)
          setSelectedField(null)
          return
        }
      }
    }
  }

  // ── Canvas inline text editing (dbl-click on canvas text) ──────────────
  const handleStartInlineEdit = (blockId: string, field: string, value: string) => {
    inlineEditRef.current = { blockId, field, startValue: value }
    setInlineEdit({ blockId, field })
    // Select the block (nested → its columns parent) WITHOUT letting the inspector steal focus
    // from the canvas input, so the field is highlighted but editing happens in place.
    const top = blocks.find(b => b.id === blockId)
    if (top) {
      selectedBlockIdRef.current = blockId
      scrollRetryRef.current = 0
      scrollToSelectedRef.current = true
      setSelectedBlockId(blockId)
      setSelectedField(null)
      return
    }
    for (const b of blocks) {
      if (b.type !== 'columns') continue
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      for (const col of items) {
        if ((Array.isArray(col?.blocks) ? col.blocks : []).some((x: any) => x.id === blockId)) {
          selectedBlockIdRef.current = b.id
          setSelectedBlockId(b.id)
          setSelectedField(null)
          return
        }
      }
    }
  }

  const handleInlineEditChange = (blockId: string, field: string, value: string) => {
    const cur = inlineEditRef.current
    if (!cur || cur.blockId !== blockId || cur.field !== field) return
    setBlocks(prev => applyInlineEdit(prev, blockId, field, value))
  }

  const handleInlineEditCommit = (blockId: string, field: string, value: string) => {
    const cur = inlineEditRef.current
    if (!cur || cur.blockId !== blockId || cur.field !== field) return
    inlineEditRef.current = null
    setInlineEdit(null)
    const updated = applyInlineEdit(blocks, blockId, field, value)
    setBlocks(updated)
    pushHistory(updated)
    savePage()
  }

  const handleInlineEditCancel = (blockId: string, field: string) => {
    const cur = inlineEditRef.current
    if (!cur || cur.blockId !== blockId || cur.field !== field) return
    inlineEditRef.current = null
    setInlineEdit(null)
    // Escape = revert the live typing to the value at edit start.
    setBlocks(prev => applyInlineEdit(prev, blockId, field, cur.startValue))
  }

  /** Reads a (possibly nested) content field value from the current blocks state. */
  const readFieldFromBlocks = (blocksList: Block[], blockId: string, field: string): unknown => {
    const readBlock = (block: Block): unknown => {
      const parts = field.split(':')
      let obj: any = block.content || {}
      for (const p of parts) {
        if (obj == null) return undefined
        obj = obj[p]
      }
      return obj
    }
    const top = blocksList.find(b => b.id === blockId)
    if (top) return readBlock(top)
    for (const b of blocksList) {
      if (b.type !== 'columns') continue
      const items = Array.isArray(b.content?.items) ? b.content.items as any[] : []
      for (const col of items) {
        const nb = (Array.isArray(col?.blocks) ? col.blocks : []).find((x: any) => x.id === blockId)
        if (nb) return readBlock(nb)
      }
    }
    return undefined
  }

  /** Canvas inline image editing: dbl-click una imagen → sube desde el dispositivo y la reemplaza en vivo.
   *  Guarda la URL anterior para que el menú contextual pueda ofrecer 'Deshacer reemplazo'. */
  const handleInlineImageUpload = (blockId: string, field: string, url: string) => {
    inlineEditRef.current = null
    setInlineEdit(null)
    const prev = readFieldFromBlocks(blocks, blockId, field)
    if (typeof prev === 'string' && prev !== url) {
      lastImageReplacementRef.current = { blockId, field, previousUrl: prev }
    }
    const updated = applyInlineEdit(blocks, blockId, field, url)
    setBlocks(updated)
    pushHistory(updated)
    savePage()
    // Selecciona el bloque + campo para que el inspector lo muestre (anidado → su columns).
    handleSelectElement(blockId, field)
  }

  /** Menú contextual → 'Deshacer reemplazo': vuelve a la URL anterior a la última sustitución de esta imagen. */
  const handleUndoImageReplacement = (blockId: string, field: string) => {
    const rep = lastImageReplacementRef.current
    if (!rep || rep.blockId !== blockId || rep.field !== field) return
    lastImageReplacementRef.current = null
    const updated = applyInlineEdit(blocks, blockId, field, rep.previousUrl)
    setBlocks(updated)
    pushHistory(updated)
    savePage()
    handleSelectElement(blockId, field)
    closeContextMenu()
  }

  /** Menú contextual → 'Copiar URL': copia la URL de la imagen al portapapeles (con fallback). */
  const handleCopyImageUrl = async (url: string) => {
    const fallback = () => {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
      setCopiedUrl(true)
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopiedUrl(true)
      } else {
        fallback()
      }
    } catch {
      fallback()
    }
    setTimeout(() => setCopiedUrl(false), 2200)
    closeContextMenu()
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
    copy: (id: string | null) => void
    cut: (id: string | null) => void
    paste: () => void
    togglePalette: () => void
  }>({ undo: () => {}, redo: () => {}, deleteBlock: () => {}, duplicate: () => {}, move: () => {}, closeModals: () => {}, copy: () => {}, cut: () => {}, paste: () => {}, togglePalette: () => {} })
  selectedBlockIdRef.current = selectedBlockId
  shortcutsRef.current = {
    undo: handleUndo,
    redo: handleRedo,
    deleteBlock: (id) => { if (id) handleDeleteBlock(id) },
    duplicate: (id) => { if (id) handleDuplicateBlock(id) },
    move: (id, dir) => { if (id) handleMoveBlock(id, dir) },
    closeModals: () => { setShowBlockPicker(false); setShowSiteSettings(false); setPaletteOpen(false); setShowShortcuts(false) },
    copy: handleCopyBlock,
    cut: handleCutBlock,
    paste: handlePasteBlock,
    togglePalette: () => togglePaletteRef.current(),
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
      if (mod && e.key.toLowerCase() === 'c') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.copy(selectedBlockId)
        return
      }
      if (mod && e.key.toLowerCase() === 'x') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.cut(selectedBlockId)
        return
      }
      if (mod && e.key.toLowerCase() === 'v') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.paste()
        return
      }
      if (mod && e.key.toLowerCase() === 'k') {
        if (typing) return
        e.preventDefault()
        shortcutsRef.current.togglePalette()
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

  // ── Command palette (Ctrl+K): jump to any window or block ──────────────
  const paletteItems = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    const items: { kind: 'window' | 'block'; id: string; label: string; sub: string; windowId?: string }[] = []
    orderedWindows.forEach(w => {
      const label = windowLabel(w)
      if (!q || label.toLowerCase().includes(q) || w.toLowerCase().includes(q)) {
        items.push({ kind: 'window', id: w, label: `🪟 ${label}`, sub: `${blocks.filter(b => (b.windowId || 'home') === w).length} secciones` })
      }
    })
    blocks.forEach(b => {
      const label = blockTypeLabel(b.type)
      const name = String((b.content as any)?.title || (b.content as any)?.brandName || '')
      const w = b.windowId || 'home'
      const hay = `${label} ${name} ${b.type}`.toLowerCase()
      if (!q || hay.includes(q)) {
        items.push({ kind: 'block', id: b.id, label, sub: name ? `${name} · ${windowLabel(w)}` : windowLabel(w), windowId: w })
      }
    })
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteQuery, blocks, orderedWindows])

  const openPalette = () => { setPaletteQuery(''); setPaletteIdx(0); setPaletteOpen(true) }
  const togglePalette = () => { if (paletteOpen) setPaletteOpen(false); else openPalette() }
  const togglePaletteRef = useRef<() => void>(() => {})
  togglePaletteRef.current = togglePalette

  const handlePaletteSelect = (item: { kind: 'window' | 'block'; id: string; label: string; windowId?: string }) => {
    setPaletteOpen(false)
    setPaletteQuery('')
    if (item.kind === 'window') {
      setPreviewWindow(item.id)
      showToast(`Ventana activa: ${windowLabel(item.id)}`)
    } else {
      setPreviewWindow(item.windowId || 'home')
      setSelectedBlockId(item.id)
      selectedBlockIdRef.current = item.id
      scrollRetryRef.current = 0
      scrollToSelectedRef.current = true
      setFlashBlockId(item.id)
      setTimeout(() => setFlashBlockId(null), 1600)
      showToast(`Sección: ${item.label}`)
    }
  }

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
          <button onClick={() => router.push('/pages')} aria-label="Volver a la lista de páginas" className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
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
              <button onClick={openAddBlockPicker} className="p-1 text-xs font-bold rounded-lg bg-[var(--color-accent-muted)] text-[var(--color-accent)] hover:opacity-80 transition-all flex items-center gap-1">
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
                  aria-label="Buscar ventana"
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
                  aria-label="Buscar secciones por nombre o tipo"
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
                        aria-expanded={!isCollapsed}
                        aria-controls={`blocks-window-${w}`}
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
                        onClick={() => { setSelectedBlockId(b.id); setSelectedField(null) }}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedBlockId(b.id)
                            setSelectedField(null)
                            return
                          }
                          // ↑/↓: mueve el foco entre las secciones listadas (con
                          // envoltura) y sincroniza la selección del editor.
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault()
                            e.stopPropagation() // no reordenar la sección (handler global)
                            const next = neighborBlockEl(blocksListRef.current, e.currentTarget, e.key === 'ArrowDown' ? 1 : -1)
                            if (!next) return
                            next.focus()
                            const nextId = next.dataset.blockId
                            if (nextId) { setSelectedBlockId(nextId); setSelectedField(null) }
                          }
                        }}
                        data-block-id={b.id}
                        role="button"
                        tabIndex={0}
                        aria-current={selectedBlockId === b.id ? 'true' : undefined}
                        aria-label={`Seleccionar sección ${b.type.replace('-', ' ')} en ${windowLabel(w)}${selectedBlockId === b.id ? ' (seleccionada)' : ''}`}
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
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(b.id) }} aria-label={`Eliminar sección ${b.type.replace('-', ' ')}`} className="p-1 hover:text-red-500 transition-all text-gray-400">
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
              <link rel="stylesheet" href={googleFontsHref(siteSettings)} />
              <style>{`
                .editor-block { position: relative; cursor: pointer; }
                .editor-block:hover { outline: 2px dashed rgba(236,72,153,0.55); outline-offset: -2px; }
                .editor-block-selected { outline: 3px solid #a855f7 !important; outline-offset: -3px !important; box-shadow: 0 0 0 6px rgba(168,85,247,0.18) !important; }
                .editor-block-dragging { opacity: 0.4; }
                .editor-block-drop-target { outline: 2px solid #0ea5e9 !important; outline-offset: -2px !important; box-shadow: 0 0 0 5px rgba(14,165,233,0.22) !important; cursor: copy; }
                .canvas-inline-input { font-family: 'Sora','Inter',system-ui,-apple-system,'Segoe UI',sans-serif !important; background: rgba(255,255,255,0.97) !important; color: #0f172a !important; border: 2px solid #a855f7 !important; border-radius: 6px !important; outline: none !important; box-shadow: 0 0 0 4px rgba(168,85,247,0.25) !important; padding: 1px 6px !important; max-width: 100% !important; min-width: 90px; cursor: text !important; margin: 0 !important; }
                .canvas-inline-input:focus { box-shadow: 0 0 0 4px rgba(168,85,247,0.38) !important; }
                [data-dragging-file] [data-inline-image] { outline: 2px dashed rgba(168,85,247,0.65); outline-offset: 3px; }
                [data-dragging-file] [data-inline-image]:hover { outline: 3px solid #a855f7; box-shadow: 0 0 0 6px rgba(168,85,247,0.22); cursor: copy; }
                .editor-insert-handle { height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; border-radius: 10px; margin: 1px 0; }
                .editor-insert-handle:hover { background: rgba(168,85,247,0.12); }
                .editor-insert-plus { width: 22px; height: 22px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #a855f7; background: rgba(168,85,247,0.14); border: 1px dashed rgba(168,85,247,0.6); opacity: 0; transition: opacity 0.15s, background 0.15s; line-height: 1; }
                .editor-insert-handle:hover .editor-insert-plus { opacity: 1; background: rgba(168,85,247,0.22); }
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
                    inlineEditRef.current = null
                    setInlineEdit(null)
                    selectedBlockIdRef.current = blockId
                    scrollRetryRef.current = 0
                    scrollToSelectedRef.current = true
                    setSelectedBlockId(blockId)
                    setSelectedField(null)
                  }
                }}
                onSelectElement={handleSelectElement}
                onBlockContextMenu={handleBlockContextMenu}
                inlineEdit={inlineEdit}
                onStartInlineEdit={handleStartInlineEdit}
                onInlineEditChange={handleInlineEditChange}
                onInlineEditCommit={handleInlineEditCommit}
                onInlineEditCancel={handleInlineEditCancel}
                onInlineImageUpload={handleInlineImageUpload}
                onNavigateWindow={(windowId) => {
                  inlineEditRef.current = null
                  setInlineEdit(null)
                  setPreviewWindow(windowId)
                }}
                onCanvasBlockDrop={(parentId, colIdx, beforeNbId, payload) => handleCanvasBlockDrop(parentId, colIdx, beforeNbId, payload)}
                onInsertBetween={handleInsertBetween}
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

            {/* Clipboard: copy / cut / paste sections */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => handleCopyBlock(selectedBlockId)}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Copiar sección seleccionada (Ctrl+C)"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={() => handleCutBlock(selectedBlockId)}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Cortar sección seleccionada (Ctrl+X)"
              >
                <Scissors size={12} />
              </button>
              <button
                onClick={handlePasteBlock}
                className={`p-1 rounded transition-colors ${clipboardBlock ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]/40 cursor-not-allowed'}`}
                title={`Pegar sección${clipboardBlock ? ` (${blockTypeLabel(clipboardBlock.type)})` : ''} (Ctrl+V)`}
              >
                <ClipboardPaste size={12} />
              </button>
            </div>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Command palette (Ctrl+K) */}
            <button
              onClick={openPalette}
              className="flex items-center gap-1.5 shrink-0 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-[var(--color-bg-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Paleta de comandos — saltar a cualquier ventana o sección (Ctrl+K)"
            >
              <Search size={12} />
              <span className="hidden lg:inline">Ir a…</span>
              <kbd className="hidden xl:inline text-[9px] font-mono px-1 py-px rounded border" style={{ borderColor: 'var(--color-border)' }}>Ctrl K</kbd>
            </button>

            <div className="w-px h-4 bg-[var(--color-border)] shrink-0" />

            {/* Keyboard shortcuts hint */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              aria-expanded={showShortcuts}
              aria-label="Atajos de teclado del lienzo"
              className="flex items-center gap-1.5 shrink-0 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:bg-[var(--color-bg-hover)]"
              style={{ color: 'var(--color-text-secondary)' }}
              title="Atajos de teclado del lienzo: ↑↓ mover · Home/End · PgUp/PgDn · F2 editar · ⇧F10 menú"
            >
              <Keyboard size={12} />
              <span className="hidden lg:inline">Atajos</span>
            </button>
            {showShortcuts && typeof document !== 'undefined' && createPortal(
              <div
                role="region"
                aria-label="Atajos de teclado del lienzo"
                className="fixed bottom-12 right-4 z-[90] w-80 rounded-xl border p-3 shadow-2xl surface-card animate-fade-in"
              >
                <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Keyboard size={13} aria-hidden="true" /> Atajos de teclado del lienzo
                </p>
                {/* Lista semántica: los lectores de pantalla anuncian la estructura y
                    cada kbd lleva su forma hablada (p. ej. “↑ ↓” se lee como flechas). */}
                <ul className="space-y-1.5 text-[10px] list-none m-0 p-0" style={{ color: 'var(--color-text-secondary)' }}>
                  {[
                    { keys: '↑ ↓', speech: 'Flecha arriba o flecha abajo', desc: 'Mover el foco entre secciones', title: 'Flechas: mover el foco de sección en sección' },
                    { keys: 'Home / End', speech: 'Home o End', desc: 'Primera / última sección', title: 'Home/End: saltar a la primera o última sección' },
                    { keys: 'PgUp / PgDn', speech: 'Re Pag o Av Pag', desc: 'Desplazar el lienzo una página', title: 'PageUp/PageDown: desplazar el lienzo sin cambiar de sección' },
                    { keys: 'F2', speech: 'F2', desc: 'Editar el primer campo de la sección', title: 'F2: edición inline del primer campo editable' },
                    { keys: '⇧ F10', speech: 'Mayúsculas más F10', desc: 'Menú contextual de la sección', title: 'Shift+F10: abrir el menú contextual' },
                    { keys: 'Supr', speech: 'Suprimir', desc: 'Eliminar la sección seleccionada', title: 'Delete/Backspace: eliminar la sección seleccionada' },
                    { keys: 'Ctrl Z / Y', speech: 'Control Z o Control Y', desc: 'Deshacer / Rehacer', title: 'Ctrl+Z deshace · Ctrl+Y (o Ctrl+Shift+Z) rehace' },
                    { keys: 'Ctrl C · X · V', speech: 'Control C, X o V', desc: 'Copiar · Cortar · Pegar sección', title: 'Portapapeles de secciones: copiar, cortar, pegar' },
                    { keys: 'Ctrl K', speech: 'Control K', desc: 'Paleta de comandos', title: 'Ctrl+K: saltar a cualquier ventana o sección' },
                    { keys: 'Ctrl D', speech: 'Control D', desc: 'Duplicar la sección seleccionada', title: 'Ctrl+D: duplicar la sección' },
                  ].map((s) => (
                    <li key={s.keys} className="flex items-center justify-between gap-3" title={s.title}>
                      <kbd aria-label={s.speech} className="text-[9px] font-mono px-1.5 py-px rounded border whitespace-nowrap" style={{ borderColor: 'var(--color-border)' }}>{s.keys}</kbd>
                      <span className="text-right">{s.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>,
              document.body
            )}

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
            focusField={selectedField}
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
              <button onClick={() => setShowAIChat(false)} aria-label="Cerrar Copiloto IA" className="p-1 rounded hover:bg-white/10 text-white transition-colors">
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
                              role={exists ? 'button' : undefined}
                              tabIndex={exists ? 0 : undefined}
                              onClick={() => {
                                if (exists && b.id) {
                                  scrollToSelectedRef.current = true
                                  setSelectedBlockId(b.id)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!exists || !b.id || e.target !== e.currentTarget) return
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  scrollToSelectedRef.current = true
                                  setSelectedBlockId(b.id)
                                }
                              }}
                              aria-label={exists ? `Ver sección ${label} en el editor` : undefined}
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
                <button onClick={handleAISend} disabled={aiGenerating || !inputPrompt.trim()} aria-label="Enviar mensaje al Copiloto" className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all">
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

              <div>
                <label className="form-label text-[11px] font-bold">Tipografía del sitio</label>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSiteSettings({ ...siteSettings, fontFamily: f.id })}
                      className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${(siteSettings.fontFamily || 'sora') === f.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-muted)] shadow-sm' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                      style={{ fontFamily: f.stack, color: 'var(--color-text-primary)' }}
                      title={f.label}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 leading-relaxed">
                  Se aplica en todo el sitio público y en el lienzo. Cada plantilla trae una tipografía sugerida.
                </p>
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

      {/* ═══════════════ COMMAND PALETTE (Ctrl+K) — saltar a ventanas y secciones ═══════════════ */}
      {paletteOpen && (() => {
        const items = paletteItems
        const safeIdx = paletteIdx >= items.length ? Math.max(0, items.length - 1) : paletteIdx
        return (
          <div className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[12vh] p-4" onClick={() => setPaletteOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl border surface-card shadow-2xl overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <Search size={15} className="text-[var(--color-text-tertiary)] shrink-0" />
                <input
                  autoFocus
                  value={paletteQuery}
                  onChange={(e) => { setPaletteQuery(e.target.value); setPaletteIdx(0) }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteIdx(i => Math.min(items.length - 1, i + 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteIdx(i => Math.max(0, i - 1)) }
                    else if (e.key === 'Enter') { e.preventDefault(); if (items[safeIdx]) handlePaletteSelect(items[safeIdx]) }
                    else if (e.key === 'Escape') { e.preventDefault(); setPaletteOpen(false) }
                  }}
                  placeholder="Buscar ventana o sección… (Inicio, Catálogo, Precios, Footer)"
                  className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                />
                <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-[var(--color-text-tertiary)]" style={{ borderColor: 'var(--color-border)' }}>ESC</kbd>
              </div>
              <div className="max-h-[46vh] overflow-y-auto py-1.5">
                {items.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs font-semibold text-[var(--color-text-tertiary)]">Sin resultados para «{paletteQuery}»</p>
                )}
                {items.map((item, i) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => handlePaletteSelect(item)}
                    onMouseEnter={() => setPaletteIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${i === safeIdx ? 'bg-[var(--color-accent)]/10' : ''}`}
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg text-[var(--color-accent)] shrink-0" style={{ background: 'var(--color-accent-muted)' }}>
                      {item.kind === 'window' ? <LayoutGrid size={13} /> : <Layers size={13} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
                      <span className="block text-[10px] font-semibold text-[var(--color-text-tertiary)] truncate">{item.sub}</span>
                    </span>
                    <span className="text-[9px] font-mono text-[var(--color-text-tertiary)]">{item.kind === 'window' ? 'Ventana' : 'Sección'}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 px-4 py-2 border-t text-[10px] font-bold text-[var(--color-text-tertiary)]" style={{ borderColor: 'var(--color-border)' }}>
                <span className="flex items-center gap-1"><Command size={10} /> K abrir</span>
                <span className="flex items-center gap-1">↑↓ navegar</span>
                <span className="flex items-center gap-1">Enter saltar</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══════════════ BLOCK PICKER (búsqueda + categorías + modo insertar) ═══════════════ */}
      {showBlockPicker && (() => {
        const catIcons: Record<string, any> = {
          '': Sparkles, layout: LayoutGrid, content: FileText, commerce: ShoppingBag, social: Users, seo: Search,
        }
        const q = pickerSearch.trim().toLowerCase()
        const blocks = pickerAllBlocks.filter(b =>
          (!pickerCategory || b.category === pickerCategory) &&
          (!q || b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.id.toLowerCase().includes(q))
        )
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border p-5 surface-card shadow-2xl flex flex-col max-h-[85vh] space-y-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    {insertTarget ? <><Plus size={15} className="text-[var(--color-accent)]" /> Insertar sección</> : 'Añadir Nueva Sección'}
                  </h3>
                  {insertTarget && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                      Se colocará justo antes de la sección señalada en el lienzo.
                    </p>
                  )}
                </div>
                <button onClick={() => setShowBlockPicker(false)} className="p-1 text-gray-400 hover:text-gray-200">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Buscar sección… (ej: precios, faq, video)"
                    className="input-field text-xs pl-8 w-full py-1.5"
                    autoFocus
                  />
                  {pickerSearch && (
                    <button onClick={() => setPickerSearch('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-200">
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 overflow-x-auto shrink-0">
                  {([['', 'Todo'], ['layout', 'Estructura'], ['content', 'Contenido'], ['commerce', 'Comercio'], ['social', 'Social'], ['seo', 'SEO']] as Array<[string, string]>).map(([id, label]) => {
                    const Icon = catIcons[id] || Sparkles
                    return (
                      <button
                        key={id}
                        onClick={() => setPickerCategory(id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${pickerCategory === id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
                      >
                        <Icon size={11} /> {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
                {blocks.map(blk => {
                  const Icon = catIcons[blk.category || ''] || Plus
                  return (
                    <button
                      key={blk.id}
                      onClick={() => handleAddBlock(blk.id)}
                      className="p-3 rounded-xl border text-left transition-all group hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-muted)]"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent-muted)' }}>
                          <Icon size={12} className="text-[var(--color-accent)]" />
                        </span>
                        <h4 className="font-bold text-xs capitalize" style={{ color: 'var(--color-text-primary)' }}>{blk.name}</h4>
                      </div>
                      <p className="text-[10px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>{blk.description}</p>
                    </button>
                  )
                })}
                {blocks.length === 0 && (
                  <p className="text-[11px] col-span-2 text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                    Sin secciones que coincidan con «{pickerSearch.trim()}».
                  </p>
                )}
              </div>

              <p className="text-[10px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                También puedes <b>arrastrar bloques</b> desde el panel izquierdo o pedirle al <b>Copiloto IA</b> que genere secciones completas.
              </p>
            </div>
          </div>
        )
      })()}

      {/* ═══════════════ CANVAS CONTEXT MENU (clic derecho) ═══════════════ */}
      {contextMenu && (() => {
        const cmBlock = blocks.find(b => b.id === contextMenu.blockId)
        const cmField = contextMenu.field
        const isTop = !!cmBlock
        const cmParent = isTop ? null : findNestedParent(contextMenu.blockId)
        const cmType = cmBlock?.type || (cmParent ? blocks.find(b => b.id === cmParent)?.type : '') || ''
        const label = BLOCK_LABELS[cmType] || cmType.replace('-', ' ') || 'Bloque'
        const sameWindow = cmBlock ? blocks.filter(b => (b.windowId || 'home') === (cmBlock.windowId || 'home')) : []
        const indexInWindow = sameWindow.findIndex(b => b.id === contextMenu.blockId)
        const x = Math.max(4, Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 232))
        const menuHeight = contextMenu.imageUrl ? 400 : 300
        const y = Math.max(4, Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - menuHeight))
        const menuItem = 'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-all hover:bg-[var(--color-bg-hover)]'
        return (
          <div
            className="fixed z-[70] w-56 rounded-xl border shadow-2xl overflow-hidden animate-fade-in"
            style={{ left: x, top: y, background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider capitalize" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
              <button onClick={closeContextMenu} className="p-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" title="Cerrar (Esc)"><X size={12} /></button>
            </div>
            <div className="p-1.5 space-y-0.5">
              {cmField && (
                <button
                  onClick={() => { handleSelectElement(contextMenu.blockId, cmField); closeContextMenu() }}
                  className={`${menuItem} text-[var(--color-accent)]`}
                  title="Seleccionar el bloque y abrir el inspector en este campo"
                >
                  <Wand2 size={13} /> <span className="truncate">Editar {fieldLabel(cmField)}</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (isTop) { setSelectedBlockId(contextMenu.blockId); setSelectedField(null) }
                  else if (cmParent) { setSelectedBlockId(cmParent); setSelectedField(null) }
                  closeContextMenu()
                }}
                className={menuItem}
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Edit3 size={13} /> <span>{isTop ? 'Editar bloque' : 'Editar bloque (columns)'}</span>
              </button>
              {contextMenu.imageUrl && cmField && (
                <>
                  <div className="px-2.5 pt-1.5 pb-0.5 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    <ImageIcon size={10} /> Imagen
                  </div>
                  <button
                    onClick={() => handleUndoImageReplacement(contextMenu.blockId, cmField)}
                    disabled={!(lastImageReplacementRef.current && lastImageReplacementRef.current.blockId === contextMenu.blockId && lastImageReplacementRef.current.field === cmField)}
                    className={`${menuItem} disabled:opacity-40 disabled:cursor-not-allowed`}
                    style={{ color: 'var(--color-text-primary)' }}
                    title="Vuelve a la imagen anterior a la última sustitución"
                  >
                    <Undo2 size={13} /> Deshacer reemplazo
                  </button>
                  <button
                    onClick={() => { handleSelectElement(contextMenu.blockId, cmField); closeContextMenu() }}
                    className={menuItem}
                    style={{ color: 'var(--color-text-primary)' }}
                    title="Seleccionar el bloque y abrir el inspector en este campo"
                  >
                    <Focus size={13} /> Abrir en el inspector
                  </button>
                  <button
                    onClick={() => handleCopyImageUrl(contextMenu.imageUrl || '')}
                    className={menuItem}
                    style={{ color: 'var(--color-text-primary)' }}
                    title="Copiar la URL de la imagen al portapapeles"
                  >
                    <Link2 size={13} /> Copiar URL
                  </button>
                  <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
                </>
              )}
              <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
              {isTop ? (
                <>
                  <button onClick={() => { handleMoveBlock(contextMenu.blockId, -1); closeContextMenu() }} disabled={indexInWindow <= 0} className={`${menuItem} disabled:opacity-40 disabled:cursor-not-allowed`} style={{ color: 'var(--color-text-primary)' }}>
                    <ArrowUp size={13} /> Subir
                  </button>
                  <button onClick={() => { handleMoveBlock(contextMenu.blockId, 1); closeContextMenu() }} disabled={indexInWindow < 0 || indexInWindow >= sameWindow.length - 1} className={`${menuItem} disabled:opacity-40 disabled:cursor-not-allowed`} style={{ color: 'var(--color-text-primary)' }}>
                    <ArrowDown size={13} /> Bajar
                  </button>
                  <button onClick={() => { handleDuplicateBlock(contextMenu.blockId); closeContextMenu() }} className={menuItem} style={{ color: 'var(--color-text-primary)' }}>
                    <Copy size={13} /> Duplicar
                  </button>
                  <button onClick={() => { handleDeleteBlock(contextMenu.blockId); closeContextMenu() }} className={`${menuItem} !text-red-500`} style={{ color: 'var(--color-error)' }}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </>
              ) : (
                <button onClick={() => { if (cmParent) handlePromoteNestedBlock(cmParent, contextMenu.blockId); closeContextMenu() }} className={menuItem} style={{ color: 'var(--color-text-primary)' }}>
                  <CornerUpLeft size={13} /> Promover a la página
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Toast de URL copiada (menú contextual de imágenes) */}
      {copiedUrl && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-2xl animate-fade-in"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Check size={13} className="text-emerald-500" /> URL de la imagen copiada
        </div>
      )}

      {/* Toast global (copiar/pegar secciones, paleta de comandos…) */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-2xl animate-fade-in"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <Check size={13} className="text-emerald-500" /> {toast}
        </div>
      )}
    </div>
  )
}
