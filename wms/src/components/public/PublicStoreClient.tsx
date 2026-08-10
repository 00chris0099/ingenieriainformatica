'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { IconRenderer } from '@/components/ui/IconRenderer'
import { X, ShoppingBag, Check, Plus, Minus, MessageSquare, Star, Trash2, ArrowLeft, ExternalLink, Facebook, Instagram, Youtube, Linkedin, Loader2, CreditCard, Lock, CheckCircle2, Send } from 'lucide-react'
import { setDragPayload, readDragPayload, type BlockDragPayload } from '@/lib/block-dnd'
import { currencySymbol as resolveSymbol, parsePrice as libParsePrice } from '@/lib/payments/checkout'

interface PublicStoreClientProps {
  pageTitle: string
  blocks: any[]
  settings?: Record<string, any>
  seo?: Record<string, any>
  /** Slug del negocio (tienda) — usado por el bloque articles en modo 'blog' para traer los posts reales. */
  businessSlug?: string
  /** Id de la página — usado por el bloque calendar para registrar de qué página vino la cita. */
  pageId?: string
  // Editor mode: renders this exact component inline inside the builder canvas
  // (100% parity with /p/[id]) with controlled-window navigation and per-block
  // selection instead of hash routing.
  editorMode?: boolean
  controlledWindow?: string
  selectedBlockId?: string | null
  onSelectBlock?: (blockId: string) => void
  onNavigateWindow?: (windowId: string) => void
  /** Editor DnD: a block was dropped on a `columns` block (container or a nested block inside it). */
  onCanvasBlockDrop?: (parentId: string, colIdx: number, beforeNbId: string | undefined, payload: BlockDragPayload) => void
}

interface CartItem {
  key: string
  id: string
  name: string
  price: number
  priceLabel: string
  size: string
  qty: number
  image?: string
}

const DEFAULT_WHATSAPP = '51999888777'
const FONT_STACK = "'Sora', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"

/** Parse 'S/ 59.90' -> 59.9 (tolerates commas/dots, US/EU thousands) */
function parsePrice(label: any): number {
  return libParsePrice(label)
}

function isDarkBg(hex: string): boolean {
  const m = (hex || '').replace('#', '')
  if (m.length !== 6) return false
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 140
}

function softBg(hex: string, alphaHex = '14'): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alphaHex}` : hex
}

/** Lightweight scroll-reveal (IntersectionObserver, no dependencies) */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {children}
    </div>
  )
}

export default function PublicStoreClient({
  pageTitle,
  blocks,
  settings,
  seo,
  businessSlug,
  pageId,
  editorMode = false,
  controlledWindow,
  selectedBlockId,
  onSelectBlock,
  onNavigateWindow,
  onCanvasBlockDrop,
}: PublicStoreClientProps) {
  const whatsappNumber = settings?.whatsappNumber || DEFAULT_WHATSAPP
  const rootAccent = settings?.accentColor || settings?.primaryColor || '#f43f5e'

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState<boolean>(false)
  const [showNotification, setShowNotification] = useState<boolean>(false)
  const [navOpen, setNavOpen] = useState<boolean>(false)

  // ── Cart persistence (survives reloads, keyed per page) ───────────────
  const cartStorageKey = `wms-cart-${pageId || 'anon'}`
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(cartStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCart(parsed)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    try {
      if (cart.length > 0) window.localStorage.setItem(cartStorageKey, JSON.stringify(cart))
      else window.localStorage.removeItem(cartStorageKey)
    } catch {
      /* ignore */
    }
  }, [cart, cartStorageKey])

  // ── Analytics: registra una vista real (una vez por sesión por página) ─
  useEffect(() => {
    if (editorMode || !pageId) return
    try {
      if (window.sessionStorage.getItem(`viewed:${pageId}`)) return
      window.sessionStorage.setItem(`viewed:${pageId}`, '1')
      // clientId estable para GA4 Measurement Protocol (persiste entre sesiones)
      let clientId = ''
      try {
        clientId = window.localStorage.getItem('wms_ga4_client_id') || ''
        if (!clientId) {
          clientId = `wms-${Date.now()}.${Math.floor(Math.random() * 1e9)}`
          window.localStorage.setItem('wms_ga4_client_id', clientId)
        }
      } catch {
        clientId = ''
      }
      const params = new URLSearchParams(window.location.search)
      fetch('/api/v1/store/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          clientId: clientId || undefined,
          referrer: document.referrer || undefined,
          utm: {
            source: params.get('utm_source') || undefined,
            medium: params.get('utm_medium') || undefined,
            campaign: params.get('utm_campaign') || undefined,
          },
          device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }),
      }).catch(() => {})
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, editorMode])

  // ── Checkout state ────────────────────────────────────────────────────
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form')
  const [checkoutForm, setCheckoutForm] = useState({ fullName: '', email: '', phone: '', address: '', notes: '' })
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'whatsapp'>('whatsapp')
  const [orderResult, setOrderResult] = useState<any>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const paymentsCfg: any = settings?.payments && typeof settings.payments === 'object' ? settings.payments : {}
  const mpAvailable = paymentsCfg?.mercadopago?.enabled !== false
  const symbol = resolveSymbol(settings?.currency)
  // Editor DnD visuals: which block is being dragged / which target is highlighted
  const [canvasDragId, setCanvasDragId] = useState<string | null>(null)
  const [canvasDropTarget, setCanvasDropTarget] = useState<{ parentId: string; nbId?: string } | null>(null)

  // ── Multi-window engine ────────────────────────────────────────────────
  // Windows are real views, not scroll anchors: 'home', 'catalogo' (with
  // category filter), any custom window id ('ofertas', 'nosotros', ...) and
  // 'product:<id>' landing windows. Hash routing (#/, #/catalogo/ninos,
  // #/ventana/ofertas, #/producto/p1) gives back/forward + shareable URLs.
  const [activeWindow, setActiveWindow] = useState<string>(editorMode ? controlledWindow || 'home' : 'home')

  const allProducts = useMemo(
    () => blocks.flatMap((b: any) => (Array.isArray(b?.content?.products) ? b.content.products : [])),
    [blocks]
  )

  useEffect(() => {
    const parseHash = (): { window: string; category: string } => {
      const h = window.location.hash
      let m = h.match(/^#\/producto\/([^/?]+)/)
      if (m) return { window: `product:${m[1]!}`, category: 'all' }
      m = h.match(/^#\/catalogo(?:\/([^/?]+))?/)
      if (m) return { window: 'catalogo', category: m[1] && m[1] !== 'all' ? m[1] : 'all' }
      m = h.match(/^#\/ventana\/([^/?]+)/)
      if (m) return { window: m[1]!, category: 'all' }
      return { window: 'home', category: 'all' }
    }

    const applyHash = () => {
      const { window: w, category } = parseHash()
      setActiveWindow(w)
      setActiveCategory(category)
      if (w.startsWith('product:')) {
        const pid = w.replace('product:', '')
        const found = allProducts.find((p: any) => String(p.id) === pid)
        if (found) {
          setSelectedProduct(found)
          const firstSize = Array.isArray(found.sizes) && found.sizes.length > 0 ? String(found.sizes[0]) : ''
          setSelectedSize(firstSize)
          setQuantity(1)
        }
      } else {
        setSelectedProduct(null)
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    // Editor mode: the builder owns the window — no hash routing here.
    if (editorMode) return
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [allProducts, editorMode])

  // Editor mode: mirror the window controlled by the builder (same logic the
  // hash router applies in public mode, including opening the product state).
  useEffect(() => {
    if (!editorMode) return
    const w = controlledWindow || 'home'
    if (w !== activeWindow) setActiveWindow(w)
    if (w.startsWith('product:')) {
      const pid = w.replace('product:', '')
      const found = allProducts.find((p: any) => String(p.id) === pid)
      if (found) {
        setSelectedProduct(found)
        setSelectedSize(Array.isArray(found.sizes) && found.sizes.length > 0 ? String(found.sizes[0]) : '')
        setQuantity(1)
      }
    } else {
      setSelectedProduct(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode, controlledWindow])

  const closeNav = () => setNavOpen(false)

  /** Navigate between windows; in editor mode the builder owns the window. */
  const navigateTo = (windowId: string) => {
    if (editorMode) {
      onNavigateWindow?.(windowId)
      return
    }
    if (windowId === 'home') window.location.hash = '#/'
    else if (windowId.startsWith('product:')) window.location.hash = `#/producto/${windowId.replace('product:', '')}`
    else if (windowId === 'catalogo') window.location.hash = '#/catalogo'
    else window.location.hash = `#/ventana/${windowId}`
  }

  /** Nav link click: in editor mode intercept and let the builder change windows. */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: any) => {
    closeNav()
    if (!editorMode) return
    e.preventDefault()
    onNavigateWindow?.(link?.windowId === 'catalogo' ? 'catalogo' : link?.windowId || 'home')
  }

  /**
   * Editor mode: wraps any block node with the selection outline + click
   * handler, so the canvas is pixel-identical to the public site AND every
   * block (navbar/footer included) is directly selectable. Blocks are also
   * draggable: top-level ones carry `{kind:'top'}` and nested ones (inside a
   * columns block, `dragMeta` set) carry `{kind:'nested'}` with their position,
   * so they can be dropped onto the left panel list (promote/reorder) and onto
   * columns blocks in the canvas (nest/insert).
   */
  const withSelection = (b: any, node: React.ReactNode, dragMeta?: { parentId: string; colIdx: number; nbIdx: number }) => {
    if (!editorMode) return node
    const isColumnsContainer = b.type === 'columns' && !dragMeta
    const isNested = !!dragMeta
    const dt = canvasDropTarget
    const dropTargetHere = dt !== null && dt.parentId === b.id && (isNested ? dt.nbId === b.id : !dt.nbId)
    const dragging = canvasDragId === b.id
    return (
      <div
        key={b.id}
        data-block-id={b.id}
        draggable
        onDragStart={(e) => {
          // Nested blocks live inside the draggable columns container: without
          // this, the container's own dragstart would hijack (and overwrite)
          // the payload once the event bubbles up.
          e.stopPropagation()
          e.dataTransfer.effectAllowed = 'move'
          if (dragMeta) {
            setDragPayload(e, { kind: 'nested', blockId: b.id, parentId: dragMeta.parentId, colIdx: dragMeta.colIdx, nbIdx: dragMeta.nbIdx })
          } else {
            setDragPayload(e, { kind: 'top', blockId: b.id })
          }
          setCanvasDragId(b.id)
        }}
        onDragEnd={() => {
          setCanvasDragId(null)
          setCanvasDropTarget(null)
        }}
        onDragOver={(e) => {
          if (!isColumnsContainer && !isNested) return
          const p = readDragPayload(e)
          if (!p) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (isNested) {
            e.stopPropagation()
            setCanvasDropTarget({ parentId: dragMeta!.parentId, nbId: b.id })
          } else {
            setCanvasDropTarget({ parentId: b.id })
          }
        }}
        onDrop={(e) => {
          if (!isColumnsContainer && !isNested) return
          e.preventDefault()
          const p = readDragPayload(e)
          setCanvasDropTarget(null)
          setCanvasDragId(null)
          if (!p) return
          if (isNested) e.stopPropagation()
          if (isNested) onCanvasBlockDrop?.(dragMeta!.parentId, dragMeta!.colIdx, b.id, p)
          else onCanvasBlockDrop?.(b.id, 0, undefined, p)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectBlock?.(b.id)
        }}
        className={`editor-block ${selectedBlockId === b.id ? 'editor-block-selected' : ''} ${dragging ? 'editor-block-dragging' : ''} ${dropTargetHere ? 'editor-block-drop-target' : ''}`}
      >
        {node}
      </div>
    )
  }

  /** Builds the shareable hash href for a navbar link */
  const hashHref = (link: any): string => {
    const w = link?.windowId
    if (w === 'home') return '#/'
    if (w === 'catalogo' || link?.categoryId) {
      return link?.categoryId && link.categoryId !== 'all' ? `#/catalogo/${link.categoryId}` : '#/catalogo'
    }
    if (typeof w === 'string' && w.startsWith('product:')) return `#/producto/${w.replace('product:', '')}`
    if (w) return `#/ventana/${w}`
    return '#/'
  }

  const isWhatsappLink = (link: any) => link?.windowId === 'whatsapp'

  const isLinkActive = (link: any) => {
    if (link?.categoryId) return activeWindow === 'catalogo' && activeCategory === link.categoryId
    if (link?.windowId === 'catalogo') return activeWindow === 'catalogo' && (!link.categoryId || activeCategory === 'all')
    if (link?.windowId === 'home') return activeWindow === 'home'
    return activeWindow === link?.windowId
  }

  const isProductWindow = activeWindow.startsWith('product:')
  const activeProduct = isProductWindow
    ? allProducts.find((p: any) => String(p.id) === activeWindow.replace('product:', '')) || null
    : null
  const hasOfertasWindow = blocks.some((b: any) => b.windowId === 'ofertas')
  const hasCatalogoWindow = blocks.some((b: any) => b.windowId === 'catalogo')

  /**
   * Effective window: falls back to 'home' when the requested window has no
   * blocks yet (handles old saved pages without windowId gracefully).
   */
  const activeWindowEffective = useMemo(() => {
    if (isProductWindow) return activeWindow
    const hasBlocks = blocks.some(b => {
      if (b.type === 'navbar' || b.type === 'footer') return false
      return b.windowId === activeWindow || (!b.windowId && activeWindow === 'home')
    })
    return hasBlocks ? activeWindow : 'home'
  }, [blocks, activeWindow, isProductWindow])

  /** Blocks belonging to the active window (navbar/footer are global) */
  const windowBlocks = useMemo(() => blocks.filter(b => {
    if (b.type === 'navbar' || b.type === 'footer') return false
    return b.windowId === activeWindowEffective || (!b.windowId && activeWindowEffective === 'home')
  }), [blocks, activeWindowEffective])

  const cartCount = cart.reduce((acc, it) => acc + it.qty, 0)
  const cartTotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0)

  const notify = (msg: string) => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2600)
  }

  const handleOpenProduct = (p: any) => {
    setSelectedProduct(p)
    setSelectedSize(Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : '')
    setQuantity(1)
  }

  // Related products for the product landing window (same category, excluding current)
  const relatedProducts = (() => {
    if (!selectedProduct) return []
    const all = blocks
      .flatMap((b: any) => (Array.isArray(b?.content?.products) ? b.content.products : []))
      .filter((p: any) => String(p.id) !== String(selectedProduct.id))
    return all.slice(0, 4)
  })()

  // ── Global navbar (rendered on every window) ──────────────────────────
  const renderNavbar = (b: any) => {
    const s = b.settings || {}
    const c = b.content || {}
    const links = Array.isArray(c.links) ? c.links : []
    const navBg = s.backgroundColor || '#ffffff'
    const navText = s.textColor || '#111827'
    const accent = s.accentColor || settings?.accentColor || settings?.primaryColor || '#f43f5e'
    const logoUrl = c.logoUrl || settings?.logoUrl || ''
    const brandName = c.brandName || settings?.siteName || seo?.title || pageTitle || 'TIENDA VIRTUAL'
    return (
      <header
        key={b.id}
        style={{ backgroundColor: navBg, color: navText, '--accent': accent } as React.CSSProperties}
        className="sticky top-0 z-40 border-b shadow-sm"
      >
        {c.announcement && (
          <div style={{ backgroundColor: accent }} className="text-center py-2 px-4 text-xs font-extrabold text-white uppercase tracking-wider">
            {c.announcement}
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <a
            href={editorMode ? '#' : '#/'}
            onClick={(e) => {
              if (editorMode) {
                e.preventDefault()
                onNavigateWindow?.('home')
              }
              closeNav()
            }}
            className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight hover:opacity-80 transition-opacity min-w-0"
            style={{ color: navText }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[150px] object-contain shrink-0" />
            ) : (
              <span className="w-3 h-3 rounded-full inline-block animate-pulse shrink-0" style={{ backgroundColor: accent }} />
            )}
            <span className="truncate">{brandName}</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link: any, idx: number) => {
              const cls = `px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 hover:opacity-70 ${isLinkActive(link) ? 'opacity-100' : 'opacity-80'}`
              const style = isLinkActive(link) ? { backgroundColor: softBg(accent, '14'), color: accent } : { color: navText }
              if (isWhatsappLink(link)) {
                return (
                  <a key={idx} href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
                    <IconRenderer name={link.iconName} size={14} />
                    {link.label}
                  </a>
                )
              }
              return (
                <a key={idx} href={hashHref(link)} onClick={(e) => handleNavClick(e, link)} className={cls} style={style}>
                  <IconRenderer name={link.iconName} size={14} />
                  {link.label}
                </a>
              )
            })}
            {/* Cart button in navbar */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative ml-2 p-2 rounded-xl transition-all hover:opacity-80 inline-flex items-center gap-1.5"
              style={{ color: navText, backgroundColor: softBg(accent, '10') }}
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={15} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center border border-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile hamburger + cart */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-xl transition-all hover:opacity-80"
              style={{ color: navText, backgroundColor: softBg(accent, '10') }}
              aria-label="Abrir carrito"
            >
              <ShoppingBag size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center border border-slate-950">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setNavOpen(!navOpen)}
              className="p-2 rounded-xl transition-all hover:opacity-80 flex flex-col gap-1"
              style={{ color: navText }}
              aria-label="Abrir menú"
            >
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${navOpen ? 'rotate-45 translate-y-1.5' : ''}`} style={{ backgroundColor: navText }} />
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${navOpen ? 'opacity-0' : ''}`} style={{ backgroundColor: navText }} />
              <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${navOpen ? '-rotate-45 -translate-y-1.5' : ''}`} style={{ backgroundColor: navText }} />
            </button>
          </div>
        </div>

        {/* Mobile lateral drawer (slide-in desde la derecha, como toda página responsive) */}
        {navOpen && (
          <div className="md:hidden fixed inset-0 z-[80]">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={closeNav}
              aria-hidden="true"
            />
            <aside
              className="absolute top-0 right-0 h-full w-[84%] max-w-[330px] shadow-2xl animate-slide-in-right flex flex-col"
              style={{ backgroundColor: navBg, borderLeft: '1px solid rgba(128,128,128,0.15)' }}
              role="dialog"
              aria-label="Menú de navegación"
            >
              {/* Header del drawer */}
              <div
                className="flex items-center justify-between px-4 py-4 border-b shrink-0"
                style={{ borderColor: 'rgba(128,128,128,0.15)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[120px] object-contain shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: accent }} />
                  )}
                  <span className="text-sm font-black truncate" style={{ color: navText }}>{brandName}</span>
                </div>
                <button
                  onClick={closeNav}
                  className="p-2 rounded-xl hover:opacity-70 transition-opacity shrink-0"
                  style={{ color: navText }}
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Links del drawer */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {links.map((link: any, idx: number) => {
                  const active = isLinkActive(link)
                  const cls = `w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold transition-all inline-flex items-center gap-2.5 ${
                    active ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                  }`
                  const style = active
                    ? { backgroundColor: softBg(accent, '16'), color: accent }
                    : { color: navText }
                  return isWhatsappLink(link) ? (
                    <a
                      key={idx}
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeNav}
                      className={cls}
                      style={style}
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: softBg(accent, '12') }}>
                        <IconRenderer name={link.iconName} size={14} />
                      </span>
                      {link.label}
                    </a>
                  ) : (
                    <a
                      key={idx}
                      href={hashHref(link)}
                      onClick={(e) => { handleNavClick(e, link); closeNav() }}
                      className={cls}
                      style={style}
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: softBg(accent, '12') }}>
                        <IconRenderer name={link.iconName} size={14} />
                      </span>
                      {link.label}
                    </a>
                  )
                })}
              </nav>

              {/* Pie del drawer: carrito + WhatsApp */}
              <div
                className="px-4 py-4 border-t space-y-2 shrink-0"
                style={{ borderColor: 'rgba(128,128,128,0.15)' }}
              >
                <button
                  onClick={() => { setCartOpen(true); closeNav() }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold transition-all"
                  style={{ backgroundColor: accent, color: '#fff' }}
                >
                  <ShoppingBag size={15} />
                  Ver carrito{cartCount > 0 ? ` (${cartCount})` : ''}
                </button>
              </div>
            </aside>
          </div>
        )}
      </header>
    )
  }

  // ── Global footer (rendered on every window) ──────────────────────────
  const renderFooter = (b: any) => {
    const s = b.settings || {}
    const c = b.content || {}
    const logoUrl = s.logoUrl || settings?.logoUrl || ''
    const variant = s.variant || 'standard'
    const fg = s.textColor || '#fff'
    const bg = s.backgroundColor || '#0f172a'
    const brand = c.companyName || c.brandName || settings?.siteName || 'TIENDA VIRTUAL'
    const cols: any[] = Array.isArray(c.columns) ? c.columns : []
    const socials: any[] = Array.isArray(c.socialLinks) ? c.socialLinks : []
    const border = 'rgba(255,255,255,0.1)'

    const socialIcon = (platform: string) => {
      const p = (platform || '').toLowerCase()
      if (p.includes('face')) return <Facebook size={14} />
      if (p.includes('insta')) return <Instagram size={14} />
      if (p.includes('yout')) return <Youtube size={14} />
      if (p.includes('linked')) return <Linkedin size={14} />
      if (p.includes('whats')) return <MessageSquare size={14} />
      if (p.includes('tiktok')) return <ExternalLink size={14} />
      return <ExternalLink size={14} />
    }

    const renderColumns = () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
        {cols.map((col: any, ci: number) => (
          <div key={ci}>
            <h4 className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: fg }}>{col.title || 'Sección'}</h4>
            <ul className="space-y-2">
              {(Array.isArray(col.links) ? col.links : []).map((l: any, li: number) => (
                <li key={li}>
                  <a href={l.url || '#'} onClick={(e) => {
                    // Enlaces internos de la tienda (#/ventana/...) navegan igual que el navbar
                    if (l.url?.startsWith('#/')) {
                      const win = l.url.replace('#/ventana/', '').replace('#/', '')
                      if (editorMode) { e.preventDefault(); onNavigateWindow?.(win) }
                      else if (win) { e.preventDefault(); window.location.hash = `#/ventana/${win}` }
                    }
                  }} className="text-xs opacity-70 hover:opacity-100 transition-opacity" style={{ color: fg }}>
                    {l.label || l.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )

    const renderSocial = () =>
      socials.length > 0 && (
        <div className="flex items-center gap-2">
          {socials.map((sc: any, si: number) => (
            <a
              key={si}
              href={sc.url || '#'}
              target={sc.url && !sc.url.startsWith('#') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:scale-105"
              style={{ borderColor: border, color: fg }}
              aria-label={sc.platform || 'red social'}
            >
              {socialIcon(sc.platform)}
            </a>
          ))}
        </div>
      )

    const renderBottomBar = () => (
      <div className="border-t pt-5 mt-10 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: border }}>
        <p className="text-[11px] opacity-50">{c.copyright || '© 2026 Todos los derechos reservados. Impulsado por WMS Platform.'}</p>
        {(s.showSocial !== false) && renderSocial()}
      </div>
    )

    return (
      <footer key={b.id} style={{ backgroundColor: bg, color: fg }} className="px-6 py-12 border-t border-white/10">
        {variant === 'minimal' ? (
          <div className="max-w-5xl mx-auto text-center space-y-3">
            {logoUrl && s.showLogo !== false && <img src={logoUrl} alt="Logo" className="h-10 w-auto max-w-[180px] object-contain mx-auto" />}
            <h3 className="text-xl font-black tracking-wider">{brand}</h3>
            <p className="text-xs opacity-60">{c.copyright || '© 2026 Todos los derechos reservados.'}</p>
          </div>
        ) : variant === 'centered' ? (
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <div className="space-y-3">
              {logoUrl && s.showLogo !== false && <img src={logoUrl} alt="Logo" className="h-10 w-auto max-w-[180px] object-contain mx-auto" />}
              <h3 className="text-xl font-black tracking-wider">{brand}</h3>
              {c.tagline && <p className="text-xs opacity-60 max-w-md mx-auto">{c.tagline}</p>}
            </div>
            <div className="flex items-center justify-center">{renderSocial()}</div>
            <p className="text-[11px] opacity-50">{c.copyright || '© 2026 Todos los derechos reservados.'}</p>
          </div>
        ) : (
          // standard: marca + columnas de enlaces + barra inferior
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <div className="md:col-span-1 space-y-3">
                {logoUrl && s.showLogo !== false && <img src={logoUrl} alt="Logo" className="h-9 w-auto max-w-[160px] object-contain" />}
                <h3 className="text-sm font-black tracking-wider">{brand}</h3>
                {c.tagline && <p className="text-[11px] opacity-60 leading-relaxed">{c.tagline}</p>}
              </div>
              <div className="md:col-span-4">{renderColumns()}</div>
            </div>
            {renderBottomBar()}
          </div>
        )}
      </footer>
    )
  }

  const addToCart = (p: any, size: string, qty: number) => {
    const key = `${p.id}-${size || 'std'}`
    setCart((prev) => {
      const existing = prev.find((it) => it.key === key)
      if (existing) {
        return prev.map((it) => (it.key === key ? { ...it, qty: it.qty + qty } : it))
      }
      return [
        ...prev,
        {
          key,
          id: p.id,
          name: p.name,
          price: parsePrice(p.price),
          priceLabel: p.price,
          size,
          qty,
          image: p.imageUrl,
        },
      ]
    })
    setSelectedProduct(null)
    setCartOpen(true)
    notify('¡Producto añadido al carrito!')
  }

  const updateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => (it.key === key ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    )
  }

  const removeItem = (key: string) => setCart((prev) => prev.filter((it) => it.key !== key))

  const buildWhatsappUrl = (p: any) => {
    const sizeText = selectedSize ? ` - Talla: ${selectedSize}` : ''
    const message = `Hola! Deseo comprar el producto: ${p.name}${sizeText} - Cantidad: ${quantity} - Precio: ${p.price}`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  const buildCartWhatsappUrl = () => {
    if (cart.length === 0) return `https://wa.me/${whatsappNumber}`
    const lines = cart.map(
      (it) => `- ${it.name}${it.size ? ` (Talla: ${it.size})` : ''} x${it.qty} = ${symbol} ${(it.price * it.qty).toFixed(2)}`
    )
    const message = `Hola! Deseo completar mi pedido:\n${lines.join('\n')}\n\nTotal: ${symbol} ${cartTotal.toFixed(2)}`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  /**
   * Real checkout: creates the order server-side (prices validated against the
   * published page) and routes to MercadoPago or WhatsApp.
   */
  const submitCheckout = async () => {
    setCheckoutError(null)
    if (!checkoutForm.fullName.trim()) {
      setCheckoutError('Ingresa tu nombre completo')
      return
    }
    if (!checkoutForm.email.trim() && !checkoutForm.phone.trim()) {
      setCheckoutError('Ingresa tu email o teléfono para coordinar tu pedido')
      return
    }
    if (cart.length === 0) {
      setCheckoutError('Tu carrito está vacío')
      return
    }
    setCheckoutStep('processing')
    try {
      const res = await fetch('/api/v1/store/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          items: cart.map((it) => ({ id: it.id, size: it.size, qty: it.qty })),
          customer: {
            fullName: checkoutForm.fullName,
            email: checkoutForm.email,
            phone: checkoutForm.phone,
            address: checkoutForm.address ? { street: checkoutForm.address } : undefined,
          },
          paymentMethod,
          notes: checkoutForm.notes || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      const data = json?.data
      if (!res.ok || !data) {
        setCheckoutStep('form')
        setCheckoutError(json?.error || 'No se pudo procesar el pedido. Intenta de nuevo.')
        return
      }
      setOrderResult(data)
      setCart([])
      setCheckoutStep('success')
      if (data.checkoutUrl) {
        // MercadoPago Checkout Pro: redirect to pay (returns via back_url → /pedido/...)
        window.location.href = data.checkoutUrl
      } else if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener')
      }
    } catch {
      setCheckoutStep('form')
      setCheckoutError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    }
  }

  /** Renders any block node — shared by windowBlocks and nested blocks (columns). */
  const renderBlockNode = (b: any, bIdx: number): React.ReactNode => {
          const s = b.settings || {}
          const c = b.content || {}
          const accent = s.accentColor || settings?.accentColor || settings?.primaryColor || '#f43f5e'

          if (b.type === 'hero') {
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#0f172a',
                  color: s.textColor || '#fff',
                  paddingTop: `${s.paddingY || 96}px`,
                  paddingBottom: `${s.paddingY || 96}px`,
                  backgroundImage: c.heroImage ? `url(${c.heroImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6 text-center relative overflow-hidden"
              >
                {c.heroImage && <div className="absolute inset-0 bg-black/55" />}
                <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                  <Reveal>
                    {c.badge && (
                      <span
                        className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border"
                        style={{ backgroundColor: softBg(accent, '18'), color: accent, borderColor: `${accent}55` }}
                      >
                        {c.badge}
                      </span>
                    )}
                  </Reveal>
                  <Reveal delay={80}>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">{c.title || 'Moda & Tendencias'}</h1>
                  </Reveal>
                  <Reveal delay={160}>
                    <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
                      {c.subtitle || 'Descubre prendas únicas diseñadas para destacar.'}
                    </p>
                  </Reveal>
                  <Reveal delay={240}>
                    <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
                      <LinkButton
                        link={c.primaryLink}
                        fallback={{ type: 'window', value: hasCatalogoWindow || allProducts.length > 0 ? 'catalogo' : 'ofertas' }}
                        editorMode={editorMode}
                        onNavigateWindow={onNavigateWindow}
                        style={{ backgroundColor: accent, boxShadow: `0 16px 40px -14px ${accent}` }}
                        className="px-8 py-4 rounded-xl text-white font-extrabold text-base hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                      >
                        <IconRenderer name="ShoppingBag" size={18} />
                        {c.buttonText || 'Ver Catálogo'}
                      </LinkButton>
                      {c.secondaryButtonText && (
                        <LinkButton
                          link={c.secondaryLink}
                          fallback={hasOfertasWindow ? { type: 'window', value: 'ofertas' } : { type: 'anchor', value: '#ofertas' }}
                          editorMode={editorMode}
                          onNavigateWindow={onNavigateWindow}
                          className="px-7 py-4 rounded-xl text-white font-bold text-base bg-white/10 border border-white/20 hover:bg-white/20 transition-all inline-flex items-center gap-2"
                        >
                          <IconRenderer name="Flame" size={18} />
                          {c.secondaryButtonText}
                        </LinkButton>
                      )}
                    </div>
                  </Reveal>
                </div>
              </section>
            )
          }

          if (b.type === 'product-grid') {
            const allProducts = Array.isArray(c.products) ? c.products : []
            const tabs = Array.isArray(c.categoryTabs) ? c.categoryTabs : []
            const filteredProducts =
              activeCategory === 'all' ? allProducts : allProducts.filter((p: any) => p.category === activeCategory)

            return (
              <section
                key={b.id}
                id="productos"
                style={{
                  backgroundColor: s.backgroundColor || '#ffffff',
                  color: s.textColor || '#111827',
                  paddingTop: `${s.paddingY || 72}px`,
                  paddingBottom: `${s.paddingY || 72}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-7xl mx-auto space-y-8">
                  <Reveal>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Catálogo de Productos'}</h2>
                      {c.subtitle && <p className="text-sm max-w-md mx-auto opacity-60">{c.subtitle}</p>}
                    </div>
                  </Reveal>

                  {tabs.length > 0 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap pb-4">
                      {tabs.map((tab: any, idx: number) => {
                        const active = activeCategory === tab.id || (activeCategory === 'all' && idx === 0)
                        return (
                          <button
                            key={tab.id || idx}
                            onClick={() => setActiveCategory(tab.id)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                              active ? 'text-white shadow-md scale-105' : 'opacity-70 hover:opacity-100'
                            }`}
                            style={active ? { backgroundColor: accent, boxShadow: `0 10px 24px -10px ${accent}` } : { backgroundColor: 'rgba(128,128,128,0.12)' }}
                          >
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredProducts.map((p: any, idx: number) => (
                      <Reveal key={p.id || idx} delay={(idx % 3) * 90}>
                        <div
                          onClick={() => handleOpenProduct(p)}
                          className="p-6 rounded-3xl border border-black/10 bg-white text-slate-900 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
                        >
                          {p.discountBadge && (
                            <span
                              className="absolute top-4 right-4 text-[10px] font-extrabold px-3 py-1 rounded-full border z-10"
                              style={{ backgroundColor: softBg(accent, '12'), color: accent, borderColor: `${accent}40` }}
                            >
                              {p.discountBadge}
                            </span>
                          )}
                          <div>
                            <div className="h-52 mb-5 rounded-2xl bg-slate-50 border border-black/5 overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform text-rose-500 relative">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              ) : (
                                <IconRenderer name={p.iconName || 'Shirt'} size={56} />
                              )}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-4 py-2 rounded-xl shadow-lg">Vista Rápida</span>
                              </div>
                            </div>
                            <h3 className="font-extrabold text-base mb-1.5 text-slate-900 leading-snug">{p.name}</h3>
                            {p.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">{p.description}</p>}

                            {Array.isArray(p.sizes) && (
                              <div className="flex gap-1.5 flex-wrap mb-4">
                                {p.sizes.map((sz: string, sIdx: number) => (
                                  <span key={sIdx} className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-baseline gap-2 mb-5">
                              <span className="text-2xl font-black" style={{ color: accent }}>
                                {p.price}
                              </span>
                              {p.originalPrice && <span className="text-xs text-slate-400 line-through">{p.originalPrice}</span>}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenProduct(p)
                            }}
                            style={{ backgroundColor: accent, boxShadow: `0 10px 26px -12px ${accent}` }}
                            className="w-full text-center text-white py-3.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
                          >
                            <ShoppingBag size={15} />
                            Comprar Ahora
                          </button>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'features') {
            const items = Array.isArray(c.items) ? c.items : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#f8fafc',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 64}px`,
                  paddingBottom: `${s.paddingY || 64}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6 border-t border-black/5"
              >
                <div className="max-w-6xl mx-auto space-y-10">
                  <Reveal>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Beneficios Exclusivos'}</h2>
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item: any, idx: number) => (
                      <Reveal key={idx} delay={(idx % 4) * 80}>
                        <div className="p-6 rounded-2xl bg-white border border-black/10 shadow-sm space-y-3 h-full">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: softBg(accent, '14'), color: accent }}
                          >
                            <IconRenderer name={item.iconName || 'ShieldCheck'} size={24} />
                          </div>
                          <h3 className="font-extrabold text-base">{item.title || 'Beneficio'}</h3>
                          <p className="text-xs opacity-60 leading-relaxed">{item.description || ''}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'pricing') {
            const plans = Array.isArray(c.plans) ? c.plans : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#ffffff',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 80}px`,
                  paddingBottom: `${s.paddingY || 80}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-6xl mx-auto space-y-8">
                  <Reveal>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Planes y Precios'}</h2>
                      {c.subtitle && <p className="text-sm max-w-md mx-auto opacity-60">{c.subtitle}</p>}
                    </div>
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    {plans.map((plan: any, idx: number) => {
                      const featured = !!plan.highlight || idx === 1
                      return (
                        <Reveal key={idx} delay={idx * 90}>
                          <div
                            className={`rounded-3xl p-7 h-full flex flex-col relative border ${
                              featured ? 'text-white shadow-2xl' : 'bg-white border-black/10 shadow-sm text-slate-900'
                            }`}
                            style={featured ? { backgroundColor: accent, borderColor: accent } : undefined}
                          >
                            {featured && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow">
                                MÁS POPULAR
                              </span>
                            )}
                            <h3 className="font-black text-lg mb-1">{plan.name}</h3>
                            <div className="text-3xl font-black mb-5">
                              {plan.price}
                            </div>
                            <ul className="space-y-2.5 mb-7 flex-1">
                              {Array.isArray(plan.features) && plan.features.map((f: string, fi: number) => (
                                <li key={fi} className="text-xs flex items-start gap-2">
                                  <Check size={14} className={`mt-0.5 shrink-0 ${featured ? 'text-white' : 'text-emerald-500'}`} />
                                  <span className="opacity-80 leading-relaxed">{f}</span>
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() => {
                                const msg = `Hola! Quiero contratar el plan ${plan.name} (${plan.price})`
                                window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank')
                              }}
                              className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all hover:opacity-90 ${
                                featured ? 'bg-white' : 'text-white'
                              }`}
                              style={featured ? { color: accent } : { backgroundColor: accent }}
                            >
                              {plan.ctaText || 'Elegir este Plan'}
                            </button>
                          </div>
                        </Reveal>
                      )
                    })}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'team') {
            const members = Array.isArray(c.items) ? c.items : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#f8fafc',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 72}px`,
                  paddingBottom: `${s.paddingY || 72}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-6xl mx-auto space-y-8">
                  <Reveal>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Nuestro Equipo'}</h2>
                      {c.subtitle && <p className="text-sm max-w-md mx-auto opacity-60">{c.subtitle}</p>}
                    </div>
                  </Reveal>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {members.map((m: any, idx: number) => (
                      <Reveal key={idx} delay={(idx % 4) * 80}>
                        <div className="text-center space-y-3">
                          <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                            {m.photo ? (
                              <img src={m.photo} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ color: accent }}>
                                <IconRenderer name="User" size={40} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm">{m.name}</p>
                            <p className="text-[11px] opacity-60 mt-0.5">{m.role}</p>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'testimonials') {
            const items = Array.isArray(c.items) ? c.items : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#ffffff',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 64}px`,
                  paddingBottom: `${s.paddingY || 64}px`,
                } as React.CSSProperties}
                className="px-6 border-t border-black/5"
              >
                <div className="max-w-5xl mx-auto space-y-8">
                  <Reveal>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Opiniones de nuestros Clientes'}</h2>
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((t: any, idx: number) => (
                      <Reveal key={idx} delay={(idx % 3) * 90}>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-black/5 space-y-3 h-full">
                          <div className="flex gap-1 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className="fill-amber-400" />
                            ))}
                          </div>
                          <p className="text-xs italic opacity-70 leading-relaxed">"{t.text || t.comment || ''}"</p>
                          <div>
                            <div className="font-bold text-xs">{t.name || 'Cliente'}</div>
                            <div className="text-[10px] opacity-50">{t.role || 'Comprador verificado'}</div>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'cta') {
            return (
              <section key={b.id} id="ofertas" style={{ backgroundColor: accent }} className="px-6 py-20 text-center text-white">
                <div className="max-w-3xl mx-auto space-y-6">
                  <Reveal>
                    <h2 className="text-3xl md:text-5xl font-black">{c.title || '¡Promoción Especial!'}</h2>
                    <p className="text-base opacity-90 leading-relaxed max-w-xl mx-auto">{c.description || ''}</p>
                    <LinkButton
                      link={c.buttonLink}
                      fallback={{ type: 'whatsapp', value: whatsappNumber }}
                      editorMode={editorMode}
                      onNavigateWindow={onNavigateWindow}
                      className="inline-flex items-center gap-2 bg-white px-9 py-4 rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all"
                      style={{ color: accent }}
                    >
                      <MessageSquare size={18} />
                      {c.buttonText || 'Obtener Oferta por WhatsApp'}
                    </LinkButton>
                  </Reveal>
                </div>
              </section>
            )
          }

          if (b.type === 'countdown') {
            return (
              <CountdownBlock key={b.id} content={c} settings={s} accent={accent} />
            )
          }

          if (b.type === 'faq' || b.type === 'accordion') {
            const items = Array.isArray(c.items) ? c.items : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#ffffff',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 64}px`,
                  paddingBottom: `${s.paddingY || 64}px`,
                } as React.CSSProperties}
                className="px-6 border-t border-black/5"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  <Reveal>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Preguntas Frecuentes'}</h2>
                    {c.subtitle && <p className="text-xs text-center opacity-60 mt-1">{c.subtitle}</p>}
                  </Reveal>
                  <div className="space-y-3">
                    {items.map((item: any, idx: number) => (
                      <FaqItem key={idx} question={item.question || item.title} answer={item.answer || item.content} accent={accent} />
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'newsletter') {
            return (
              <NewsletterBlock key={b.id} content={c} settings={s} accent={accent} />
            )
          }

          if (b.type === 'gallery') {
            const images = Array.isArray(c.images) ? c.images.map((img: any) => (typeof img === 'string' ? img : img.src || img.imageUrl)) : []
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#f8fafc',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 64}px`,
                  paddingBottom: `${s.paddingY || 64}px`,
                } as React.CSSProperties}
                className="px-6 border-t border-black/5"
              >
                <div className="max-w-6xl mx-auto space-y-8">
                  <Reveal>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Galería'}</h2>
                    {c.subtitle && <p className="text-xs text-center opacity-60 mt-1">{c.subtitle}</p>}
                  </Reveal>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((src: string, idx: number) => (
                      <Reveal key={idx} delay={(idx % 3) * 80}>
                        <a href={src} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden aspect-square bg-slate-100 group">
                          <img src={src} alt={`${c.title || 'Galería'} ${idx + 1}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </a>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'social-proof') {
            const messages = Array.isArray(c.messages) ? c.messages : []
            return (
              <SocialProofBlock key={b.id} content={c} settings={s} accent={accent} messages={messages} />
            )
          }

          if (b.type === 'contact') {
            return (
              <ContactBlock key={b.id} content={c} settings={s} accent={accent} whatsappNumber={whatsappNumber} pageId={pageId} />
            )
          }

          if (b.type === 'columns') {
            const cols = Math.max(1, parseInt(String(s.columns || '2'), 10) || 2)
            const gap = s.gap || '32px'
            const vAlign = s.verticalAlign || 'top'
            const legacyCols = Array.isArray(c.columns) ? c.columns : []
            const items =
              Array.isArray(c.items) && c.items.length > 0
                ? c.items
                : legacyCols.map((col: any) => ({ width: `${col.width || 50}%`, blocks: [], text: col.content || '' }))
            const vAlignStyle = vAlign === 'center' ? 'center' : vAlign === 'bottom' ? 'end' : 'start'
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : 'transparent',
                  paddingTop: `${parseInt(String(s.paddingY || 40), 10)}px`,
                  paddingBottom: `${parseInt(String(s.paddingY || 40), 10)}px`,
                }}
                className="px-6"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gap,
                    alignItems: vAlignStyle,
                  }}
                >
                  {items.slice(0, cols).map((col: any, colIdx: number) => (
                    <div key={colIdx} style={{ minWidth: 0 }}>
                      {col.text ? (
                        <p className="text-sm leading-relaxed" style={{ color: s.textColor || '#334155' }}>{col.text}</p>
                      ) : null}
                      {(Array.isArray(col.blocks) ? col.blocks : []).map((nb: any, nbIdx: number) => {
                        const nested = renderBlockNode(nb, nbIdx)
                        if (!nested) return null
                        return withSelection(nb, nested, { parentId: b.id, colIdx, nbIdx })
                      })}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (b.type === 'image') {
            const imgSrc = c.src || c.imageUrl || ''
            const imgAlt = c.alt || c.caption || 'Imagen'
            const imgLink = c.link || ''
            const imgWidth = s.width || '100%'
            const img = imgSrc ? (
              <img
                src={imgSrc}
                alt={imgAlt}
                loading="lazy"
                style={{
                  width: imgWidth,
                  maxWidth: '100%',
                  objectFit: s.objectFit || 'cover',
                  borderRadius: s.borderRadius || '0px',
                }}
                className="h-auto"
              />
            ) : (
              <div
                className="w-full h-40 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-bold opacity-40"
                style={{ borderColor: 'currentColor' }}
              >
                Imagen sin configurar
              </div>
            )
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : 'transparent',
                  paddingTop: `${parseInt(String(s.paddingY || 0), 10)}px`,
                  paddingBottom: `${parseInt(String(s.paddingY || 0), 10)}px`,
                  textAlign: 'center',
                }}
                className="px-6"
              >
                <div style={{ margin: '0 auto' }}>
                  {imgLink ? (
                    <a href={imgLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                  {s.variant === 'caption' && c.caption && (
                    <p className="text-xs opacity-60 mt-3" style={{ color: s.textColor || '#94a3b8' }}>{c.caption}</p>
                  )}
                </div>
              </section>
            )
          }

          if (b.type === 'text') {
            const variant = s.variant || 'paragraph'
            const align = s.textAlign || 'left'
            const bg = s.backgroundColor && s.backgroundColor !== 'transparent' ? s.backgroundColor : null
            const textColor = s.textColor || (bg ? '#0f172a' : '#f1f5f9')
            const maxWidth = s.maxWidth || '800px'
            const renderInline = (t: string) =>
              String(t || '')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br/>')
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: bg || 'transparent',
                  paddingTop: `${parseInt(String(s.paddingY || 40), 10)}px`,
                  paddingBottom: `${parseInt(String(s.paddingY || 40), 10)}px`,
                  textAlign: align,
                }}
                className="px-6"
              >
                <div
                  style={{ maxWidth, margin: align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : undefined }}
                  className={align === 'center' ? 'mx-auto' : ''}
                >
                  {variant === 'heading-text' && c.title && (
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4" style={{ color: s.headingColor || (bg ? '#0f172a' : '#ffffff') }}>
                      {c.title}
                    </h2>
                  )}
                  {variant === 'quote' ? (
                    <blockquote className="border-l-4 pl-5 text-lg italic opacity-90 leading-relaxed" style={{ borderColor: accent, color: textColor }}>
                      <span dangerouslySetInnerHTML={{ __html: renderInline(c.text) }} />
                    </blockquote>
                  ) : (
                    <div
                      className="text-base leading-relaxed"
                      style={{ color: textColor }}
                      dangerouslySetInnerHTML={{ __html: renderInline(c.text) }}
                    />
                  )}
                </div>
              </section>
            )
          }

          if (b.type === 'calendar') {
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#0f172a',
                  color: s.textColor || '#fff',
                  paddingTop: `${s.paddingY || 72}px`,
                  paddingBottom: `${s.paddingY || 72}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-3xl mx-auto">
                  <Reveal>
                    <div className="text-center space-y-3 mb-8">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Agenda tu sesión'}</h2>
                      {c.subtitle && <p className="text-sm md:text-base opacity-70 max-w-xl mx-auto leading-relaxed">{c.subtitle}</p>}
                    </div>
                  </Reveal>
                  <CalendarSection content={c} settings={s} accent={accent} businessSlug={businessSlug} pageId={pageId} editorMode={editorMode} />
                </div>
              </section>
            )
          }

          if (b.type === 'vsl') {
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#0f172a',
                  color: s.textColor || '#fff',
                  paddingTop: `${s.paddingY || 72}px`,
                  paddingBottom: `${s.paddingY || 72}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  <Reveal>
                    <div className="text-center space-y-3">
                      {c.badge && (
                        <span
                          className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border"
                          style={{ backgroundColor: softBg(accent, '18'), color: accent, borderColor: `${accent}55` }}
                        >
                          {c.badge}
                        </span>
                      )}
                      {c.headline && <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{c.headline}</h2>}
                    </div>
                  </Reveal>
                  <Reveal delay={100}>
                    <VslSection content={c} settings={s} accent={accent} />
                  </Reveal>
                  {c.ctaText && (
                    <Reveal delay={180}>
                      <div className="text-center">
                        <a
                          href={c.ctaUrl || '#cta'}
                          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-extrabold text-base hover:scale-105 active:scale-95 transition-all"
                          style={{ backgroundColor: accent, boxShadow: `0 16px 40px -14px ${accent}` }}
                        >
                          {c.ctaText}
                        </a>
                      </div>
                    </Reveal>
                  )}
                </div>
              </section>
            )
          }

          if (b.type === 'articles') {
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#ffffff',
                  color: s.textColor || '#0f172a',
                  paddingTop: `${s.paddingY || 72}px`,
                  paddingBottom: `${s.paddingY || 72}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6"
              >
                <div className="max-w-7xl mx-auto space-y-10">
                  <Reveal>
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Últimas publicaciones'}</h2>
                      {c.subtitle && <p className="text-sm max-w-xl mx-auto opacity-60">{c.subtitle}</p>}
                    </div>
                  </Reveal>
                  <ArticlesSection content={c} settings={s} accent={accent} businessSlug={businessSlug} />
                </div>
              </section>
            )
          }

          // Known blocks without a template-level renderer are skipped gracefully

          return null
  }

  return (
    <div
      className="min-h-screen font-sans text-slate-100 relative"
      style={{ fontFamily: FONT_STACK, backgroundColor: '#0b0f1a' }}
    >
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-24 right-6 z-[60] bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Check size={18} className="font-bold" />
          <span className="text-xs font-bold">¡Producto añadido al carrito!</span>
        </div>
      )}

      <main>
        {/* ═══ GLOBAL NAVBAR — visible on every window ═══ */}
        {blocks.filter((b: any) => b.type === 'navbar').map((b: any) => withSelection(b, renderNavbar(b)))}

        {isProductWindow && activeProduct ? (
          /* ═══ PRODUCT LANDING WINDOW — a real page per product ═══ */
          <section className="px-4 py-10 md:py-14 bg-slate-50">
            <div className="max-w-6xl mx-auto space-y-8">
              <button
                onClick={() => navigateTo('catalogo')}
                className="inline-flex items-center gap-1.5 text-xs font-bold opacity-60 hover:opacity-100 transition-all"
              >
                <ArrowLeft size={14} /> Volver al catálogo
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="h-72 md:h-[420px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center relative">
                  {activeProduct.imageUrl ? (
                    <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <IconRenderer name={activeProduct.iconName || 'Shirt'} size={96} style={{ color: rootAccent }} />
                  )}
                  {activeProduct.discountBadge && (
                    <span
                      className="absolute top-4 left-4 text-[10px] font-extrabold px-3 py-1 rounded-full border bg-white/90"
                      style={{ color: rootAccent, borderColor: `${rootAccent}40` }}
                    >
                      {activeProduct.discountBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-4 flex flex-col">
                  <div>
                    <span
                      className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
                      style={{ backgroundColor: softBg(rootAccent, '10'), color: rootAccent, borderColor: `${rootAccent}40` }}
                    >
                      PRODUCTO DESTACADO
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-3 leading-tight">{activeProduct.name}</h1>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      {activeProduct.description || 'Producto de alta calidad con acabados nivel exportación.'}
                    </p>
                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="text-4xl font-black" style={{ color: rootAccent }}>{activeProduct.price}</span>
                      {activeProduct.originalPrice && <span className="text-base text-slate-400 line-through">{activeProduct.originalPrice}</span>}
                    </div>
                  </div>

                  {Array.isArray(activeProduct.sizes) && activeProduct.sizes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Selecciona tu Talla:</label>
                      <div className="flex gap-2 flex-wrap">
                        {activeProduct.sizes.map((sz: string) => (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                              selectedSize === sz ? 'text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                            style={selectedSize === sz ? { backgroundColor: rootAccent, borderColor: rootAccent } : undefined}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                    <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-black w-4 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <a
                      href={buildWhatsappUrl(activeProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare size={16} /> Comprar por WhatsApp
                    </a>
                    <button
                      onClick={() => addToCart(activeProduct, selectedSize, quantity)}
                      style={{ backgroundColor: rootAccent }}
                      className="w-full hover:opacity-90 text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <ShoppingBag size={16} /> Añadir al Carrito
                    </button>
                  </div>

                  {/* Product landing guarantees strip */}
                  <div className="grid grid-cols-3 gap-3 pt-4 mt-2 border-t border-slate-100">
                    {[
                      { icon: 'Truck', label: 'Envío 24h' },
                      { icon: 'RefreshCw', label: 'Cambios gratis' },
                      { icon: 'ShieldCheck', label: 'Garantía total' },
                    ].map((g) => (
                      <div key={g.label} className="flex flex-col items-center gap-1.5 text-center">
                        <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: softBg(rootAccent, '12'), color: rootAccent }}>
                          <IconRenderer name={g.icon} size={16} />
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Related products (navigate between product windows) */}
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">También te puede gustar</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {relatedProducts.map((rp: any) => (
                      <a
                        key={rp.id || rp.name}
                        href={editorMode ? '#' : `#/producto/${rp.id}`}
                        onClick={(e) => {
                          if (editorMode) {
                            e.preventDefault()
                            onNavigateWindow?.(`product:${rp.id}`)
                          }
                        }}
                        className="group text-left rounded-xl overflow-hidden border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all"
                      >
                        <div className="h-20 bg-slate-50 overflow-hidden">
                          {rp.imageUrl ? (
                            <img src={rp.imageUrl} alt={rp.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center" style={{ color: rootAccent }}>
                              <IconRenderer name={rp.iconName || 'Shirt'} size={22} />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] font-bold text-slate-700 truncate">{rp.name}</p>
                          <p className="text-[10px] font-black mt-0.5" style={{ color: rootAccent }}>{rp.price}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
        windowBlocks.map((b, bIdx) => {
          const node = renderBlockNode(b, bIdx)
          if (!node) return null
          return withSelection(b, node)
        })
        )}

        {/* ═══ GLOBAL FOOTER — visible on every window ═══ */}
        {blocks.filter((b: any) => b.type === 'footer').map((b: any) => withSelection(b, renderFooter(b)))}
      </main>

      {/* ═══════════════ ENTERPRISE QUICK VIEW PRODUCT MODAL ═══════════════ */}
      {selectedProduct && !isProductWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 overflow-hidden">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 md:h-full min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <IconRenderer name={selectedProduct.iconName || 'Shirt'} size={72} style={{ color: rootAccent }} />
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border"
                    style={{ backgroundColor: softBg(rootAccent, '10'), color: rootAccent, borderColor: `${rootAccent}40` }}
                  >
                    {selectedProduct.discountBadge || 'PRODUCTO DESTACADO'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {selectedProduct.description || 'Prenda de alta durabilidad con acabados nivel exportación.'}
                  </p>

                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-3xl font-black" style={{ color: rootAccent }}>
                      {selectedProduct.price}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">{selectedProduct.originalPrice}</span>
                    )}
                  </div>
                </div>

                {Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Selecciona tu Talla:</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.sizes.map((sz: string) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            selectedSize === sz ? 'text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          style={selectedSize === sz ? { backgroundColor: rootAccent, borderColor: rootAccent } : undefined}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                  <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-black w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={buildWhatsappUrl(selectedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageSquare size={16} />
                    Comprar por WhatsApp
                  </a>
                  <button
                    onClick={() => addToCart(selectedProduct, selectedSize, quantity)}
                    style={{ backgroundColor: rootAccent }}
                    className="w-full hover:opacity-90 text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag size={16} />
                    Añadir al Carrito
                  </button>
                  <button
                    onClick={() => {
                      const pid = selectedProduct.id
                      setSelectedProduct(null)
                      navigateTo(`product:${pid}`)
                    }}
                    className="w-full py-2.5 rounded-xl font-extrabold text-xs border transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                    style={{ borderColor: 'var(--color-border, #e2e8f0)', color: '#334155' }}
                  >
                    <ExternalLink size={14} />
                    Ver página completa del producto
                  </button>
                </div>
              </div>
            </div>

            {/* Product landing: guarantees strip */}
            <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100">
              {[
                { icon: 'Truck', label: 'Envío 24h' },
                { icon: 'RefreshCw', label: 'Cambios gratis' },
                { icon: 'ShieldCheck', label: 'Garantía total' },
              ].map((g) => (
                <div key={g.label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: softBg(rootAccent, '12'), color: rootAccent }}>
                    <IconRenderer name={g.icon} size={16} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">{g.label}</span>
                </div>
              ))}
            </div>

            {/* Related products mini-grid */}
            {relatedProducts.length > 0 && (
              <div className="pt-5 mt-5 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">También te puede gustar</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {relatedProducts.map((rp: any) => (
                    <button
                      key={rp.id || rp.name}
                      onClick={() => handleOpenProduct(rp)}
                      className="group text-left rounded-xl overflow-hidden border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all"
                    >
                      <div className="h-20 bg-slate-50 overflow-hidden">
                        {rp.imageUrl ? (
                          <img src={rp.imageUrl} alt={rp.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: rootAccent }}>
                            <IconRenderer name={rp.iconName || 'Shirt'} size={22} />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{rp.name}</p>
                        <p className="text-[10px] font-black mt-0.5" style={{ color: rootAccent }}>{rp.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ CART DRAWER ═══════════════ */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setCartOpen(false)}>
          <div
            className="w-full max-w-md h-full bg-white text-slate-900 shadow-2xl flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-black text-lg flex items-center gap-2">
                <ShoppingBag size={18} style={{ color: rootAccent }} />
                Tu Carrito
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: rootAccent }}>
                  {cartCount}
                </span>
              </h3>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: softBg(rootAccent, '10') }}>
                    <ShoppingBag size={26} style={{ color: rootAccent }} />
                  </div>
                  <p className="font-bold text-sm">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400">Explora el catálogo y añade tus productos favoritos.</p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-2 px-6 py-2.5 rounded-xl text-white text-xs font-extrabold"
                    style={{ backgroundColor: rootAccent }}
                  >
                    Seguir Comprando
                  </button>
                </div>
              ) : (
                cart.map((it) => (
                  <div key={it.key} className="flex gap-3 items-center border border-slate-100 rounded-2xl p-3">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-16 h-16 rounded-xl object-cover bg-slate-50" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                        <IconRenderer name="Shirt" size={24} style={{ color: rootAccent }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold truncate">{it.name}</p>
                      {it.size && <p className="text-[10px] text-slate-400 mt-0.5">Talla: {it.size}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-black" style={{ color: rootAccent }}>
                          {symbol} {(it.price * it.qty).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-0.5">
                          <button onClick={() => updateQty(it.key, -1)} className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-slate-200">
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-black w-4 text-center">{it.qty}</span>
                          <button onClick={() => updateQty(it.key, 1)} className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-slate-200">
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(it.key)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Total</span>
                  <span className="text-2xl font-black" style={{ color: rootAccent }}>
                    {symbol} {cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: rootAccent, boxShadow: `0 12px 28px -10px ${rootAccent}` }}
                >
                  <Lock size={15} />
                  Finalizar Compra
                </button>
                <a
                  href={buildCartWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={15} />
                  Pedir por WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ CHECKOUT OVERLAY ═══════════════ */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => checkoutStep !== 'processing' && setCheckoutOpen(false)}>
          <div
            className="w-full max-w-3xl h-full bg-white text-slate-900 shadow-2xl flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Lock size={17} style={{ color: rootAccent }} />
                Checkout Seguro
              </h3>
              <button
                onClick={() => setCheckoutOpen(false)}
                disabled={checkoutStep === 'processing'}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
                aria-label="Cerrar checkout"
              >
                <X size={16} />
              </button>
            </div>

            {checkoutStep === 'form' && (
              <div className="flex-1 overflow-y-auto grid md:grid-cols-5">
                {/* Customer form */}
                <div className="md:col-span-3 px-6 py-6 space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1.5">Nombre completo *</label>
                    <input
                      value={checkoutForm.fullName}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                      placeholder="Ej: María Pérez"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-transparent focus:ring-2 outline-none text-sm font-semibold placeholder:text-slate-300"
                      style={{ ['--tw-ring-color' as any]: rootAccent }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none text-sm font-semibold placeholder:text-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-600 mb-1.5">Teléfono / WhatsApp</label>
                      <input
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        placeholder="+51 999 888 777"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none text-sm font-semibold placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1.5">Dirección de entrega</label>
                    <input
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="Calle, ciudad, referencia"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none text-sm font-semibold placeholder:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-600 mb-1.5">Notas del pedido</label>
                    <textarea
                      value={checkoutForm.notes}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                      placeholder="Detalles que quieras indicar…"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 outline-none text-sm font-semibold placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </div>

                {/* Summary + payment method */}
                <div className="md:col-span-2 bg-slate-50 px-6 py-6 flex flex-col gap-5">
                  <div className="space-y-3">
                    {cart.map((it) => (
                      <div key={it.key} className="flex items-center gap-3">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-11 h-11 rounded-lg object-cover bg-white" />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center" style={{ color: rootAccent }}>
                            <IconRenderer name="Shirt" size={18} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold truncate">{it.name} × {it.qty}</p>
                          {it.size && <p className="text-[10px] text-slate-400">Talla: {it.size}</p>}
                        </div>
                        <span className="text-xs font-black">{symbol} {(it.price * it.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal</span>
                      <span>{symbol} {cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Envío</span>
                      <span>{cartTotal >= 150 ? 'GRATIS' : `${symbol} 10.00`}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                      <span className="font-black">Total</span>
                      <span className="text-xl font-black" style={{ color: rootAccent }}>
                        {symbol} {(cartTotal + (cartTotal >= 150 ? 0 : 10)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Método de pago</p>
                    {mpAvailable && (
                      <button
                        onClick={() => setPaymentMethod('mercadopago')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === 'mercadopago' ? 'border-[#009ee3] bg-[#009ee3]/5' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <CreditCard size={17} style={{ color: paymentMethod === 'mercadopago' ? '#009ee3' : '#64748b' }} />
                        <span className="flex-1">
                          <span className="block text-xs font-extrabold">Tarjeta / MercadoPago</span>
                          <span className="block text-[10px] text-slate-400">Pago seguro con tarjeta, Yape o Plin</span>
                        </span>
                        {paymentMethod === 'mercadopago' && <Check size={15} className="text-[#009ee3]" />}
                      </button>
                    )}
                    <button
                      onClick={() => setPaymentMethod('whatsapp')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        paymentMethod === 'whatsapp' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <MessageSquare size={17} style={{ color: paymentMethod === 'whatsapp' ? '#10b981' : '#64748b' }} />
                      <span className="flex-1">
                        <span className="block text-xs font-extrabold">WhatsApp</span>
                        <span className="block text-[10px] text-slate-400">Confirmas el pedido y pagas al recibir</span>
                      </span>
                      {paymentMethod === 'whatsapp' && <Check size={15} className="text-emerald-500" />}
                    </button>
                  </div>

                  {checkoutError && (
                    <p className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-3 py-2.5">{checkoutError}</p>
                  )}

                  <button
                    onClick={submitCheckout}
                    className="w-full text-white py-4 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ backgroundColor: rootAccent, boxShadow: `0 14px 30px -10px ${rootAccent}` }}
                  >
                    <Lock size={15} />
                    Pagar {symbol} {(cartTotal + (cartTotal >= 150 ? 0 : 10)).toFixed(2)}
                  </button>
                  <p className="text-center text-[10px] text-slate-400">🔒 Tus datos están protegidos. No compartimos tu información.</p>
                </div>
              </div>
            )}

            {checkoutStep === 'processing' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                <Loader2 size={40} className="animate-spin" style={{ color: rootAccent }} />
                <p className="font-black text-sm">Procesando tu pedido…</p>
                <p className="text-xs text-slate-400">Estamos validando los productos y generando el pago seguro.</p>
              </div>
            )}

            {checkoutStep === 'success' && orderResult && (
              <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-5 px-6 py-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h4 className="text-xl font-black">¡Pedido {orderResult.order?.orderNumber} creado!</h4>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
                    {orderResult.checkoutUrl
                      ? 'Te enviamos a MercadoPago para completar el pago. Si no se abrió, usa el botón de abajo.'
                      : 'Abrimos WhatsApp con tu pedido. Envíalo al vendedor para confirmar la compra.'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl px-6 py-4 flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total</p>
                    <p className="text-2xl font-black" style={{ color: rootAccent }}>
                      {orderResult.order?.symbol || symbol} {Number(orderResult.order?.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-slate-200" />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Estado</p>
                    <p className="text-sm font-extrabold text-amber-500">Pendiente de pago</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {orderResult.checkoutUrl ? (
                    <a
                      href={orderResult.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl text-white font-extrabold text-sm inline-flex items-center gap-2"
                      style={{ backgroundColor: rootAccent }}
                    >
                      <CreditCard size={15} /> Pagar con MercadoPago
                    </a>
                  ) : (
                    <a
                      href={orderResult.whatsappUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-extrabold text-sm inline-flex items-center gap-2"
                    >
                      <MessageSquare size={15} /> Reabrir WhatsApp
                    </a>
                  )}
                  <a
                    href={`/pedido/${orderResult.order?.orderNumber}`}
                    className="px-6 py-3 rounded-xl border border-slate-200 font-extrabold text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Ver estado del pedido
                  </a>
                </div>
                <button onClick={() => setCheckoutOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                  Seguir comprando
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart FAB */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setCartOpen(true)}
          style={{ backgroundColor: rootAccent, boxShadow: `0 12px 30px -8px ${rootAccent}` }}
          className="text-white p-4 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center relative hover:scale-110 active:scale-95 transition-all"
          aria-label="Abrir carrito"
        >
          <ShoppingBag size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════ ENTERPRISE EXTRA BLOCKS ═══════════════ */

function CountdownBlock({ content, settings, accent }: { content: any; settings: any; accent: string }) {
  const end = content.endDate
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    if (!end) return
    const target = new Date(end).getTime()
    if (isNaN(target)) return
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [end])

  return (
    <section
      id="ofertas"
      style={{ backgroundColor: accent }}
      className="px-6 py-20 text-center text-white relative overflow-hidden"
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-3xl mx-auto space-y-6 relative">
        <Reveal>
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-xs font-extrabold uppercase tracking-widest">
            ⏳ {content.badge || 'Oferta por tiempo limitado'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mt-4">{content.title || '¡No te quedes sin la tuya!'}</h2>
          {content.subtitle && <p className="text-sm md:text-base opacity-90 max-w-xl mx-auto">{content.subtitle}</p>}
        </Reveal>

        {left && (
          <div className="flex items-center justify-center gap-3 md:gap-4">
            {[
              { v: left.d, l: 'Días' },
              { v: left.h, l: 'Horas' },
              { v: left.m, l: 'Min' },
              { v: left.s, l: 'Seg' },
            ].map((u) => (
              <div key={u.l} className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[70px]">
                <div className="text-3xl md:text-5xl font-black tabular-nums">{String(u.v).padStart(2, '0')}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 mt-1">{u.l}</div>
              </div>
            ))}
          </div>
        )}

        {content.buttonText && (
          <a
            href={`#${content.buttonHref || 'productos'}`}
            className="inline-flex items-center gap-2 bg-white px-8 py-4 rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all"
            style={{ color: accent }}
          >
            <ShoppingBag size={18} />
            {content.buttonText}
          </a>
        )}
      </div>
    </section>
  )
}

function FaqItem({ question, answer, accent }: { question: string; answer: string; accent: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-black/10 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-bold text-sm md:text-base">{question}</span>
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
          style={{ backgroundColor: softBg(accent, '12'), color: accent }}
        >
          <Plus size={14} />
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm opacity-70 leading-relaxed animate-fade-in-down">{answer}</div>
      )}
    </div>
  )
}

function NewsletterBlock({ content, settings, accent }: { content: any; settings: any; accent: string }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const bg = settings.backgroundColor || '#0f172a'
  const fg = settings.textColor || '#ffffff'

  return (
    <section style={{ backgroundColor: bg, color: fg }} className="px-6 py-16 border-t border-white/10">
      <div className="max-w-2xl mx-auto text-center space-y-5">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-black">{content.title || 'Únete a nuestro Club VIP'}</h2>
          <p className="text-xs md:text-sm opacity-70">{content.subtitle || 'Recibe ofertas exclusivas y cupones de descuento directo a tu correo.'}</p>
        </Reveal>
        {done ? (
          <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-extrabold" style={{ backgroundColor: softBg(accent, '18'), color: accent }}>
            <Check size={16} /> ¡Gracias por suscribirte!
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await fetch('/api/v1/newsletter', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
              } catch { /* degrade silently */ }
              setBusy(false)
              setDone(true)
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="flex-1 px-4 py-3.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/60"
            />
            <button
              type="submit"
              disabled={busy}
              className="px-6 py-3.5 rounded-xl text-sm font-extrabold text-white hover:opacity-90 transition-all disabled:opacity-60"
              style={{ backgroundColor: accent }}
            >
              {busy ? 'Enviando...' : content.buttonText || 'Suscribirme'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

function SocialProofBlock({ content, settings, accent, messages }: { content: any; settings: any; accent: string; messages: string[] }) {
  const [visible, setVisible] = useState(false)
  const [idx, setIdx] = useState(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (settings.enabled === false) return
    const hide = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setVisible(false), 4000)
    }
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % Math.max(1, messages.length))
      setVisible(true)
      hide()
    }, (settings.interval || 6) * 1000)
    const first = setTimeout(() => setVisible(true), 2500)
    const firstHide = setTimeout(() => setVisible(false), 6500)
    return () => { clearInterval(t); clearTimeout(first); clearTimeout(firstHide); if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [messages.length, settings.enabled, settings.interval])

  if (messages.length === 0) return null

  return (
    <div className={`fixed bottom-24 left-4 z-40 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 max-w-[300px] border border-black/5">
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white shrink-0" style={{ backgroundColor: accent }}>
          <MessageSquare size={15} />
        </div>
        <p className="text-[11px] font-semibold leading-snug opacity-80">{messages[idx % messages.length]}</p>
      </div>
    </div>
  )
}

function ContactBlock({ content, settings, accent, whatsappNumber, pageId }: { content: any; settings: any; accent: string; whatsappNumber: string; pageId?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Captura real de leads: el prospecto queda en el CRM de la tienda (tipo contact)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setError('Ingresa tu nombre y un email o teléfono')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/store/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          source: 'contact',
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) {
        setError(json?.error || 'No se pudo enviar. Intenta de nuevo.')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola! Soy ${form.name || 'un cliente'}${form.phone ? ` (${form.phone})` : ''}. ${form.message || 'Quisiera más información.'}`
  )}`

  return (
    <section
      id="contacto"
      style={{
        backgroundColor: settings.backgroundColor || '#f8fafc',
        color: settings.textColor || '#0f172a',
        paddingTop: `${settings.paddingY || 64}px`,
        paddingBottom: `${settings.paddingY || 64}px`,
      } as React.CSSProperties}
      className="px-6 border-t border-black/5"
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-extrabold text-center">{content.title || 'Contáctanos'}</h2>
          {content.subtitle && <p className="text-xs text-center opacity-60 mt-1">{content.subtitle}</p>}
        </Reveal>
        <Reveal>
          {submitted ? (
            <div className="p-8 md:p-10 rounded-3xl bg-white border border-black/10 shadow-sm text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: softBg(accent, '12'), color: accent }}>
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-lg font-extrabold">{content.successTitle || '¡Gracias por escribirnos!'}</h3>
              <p className="text-sm opacity-60">{content.successMessage || 'Recibimos tu mensaje. Te contactaremos muy pronto.'}</p>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold opacity-70 hover:opacity-100 transition-opacity mt-2">
                <MessageSquare size={13} /> ¿Prefieres WhatsApp? Escríbenos aquí
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre *"
                className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-slate-900 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': accent } as any}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Tu email"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-slate-900 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': accent } as any}
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Tu teléfono / WhatsApp"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-slate-900 focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': accent } as any}
                />
              </div>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="¿En qué podemos ayudarte?"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-slate-900 focus:outline-none focus:ring-2 resize-none"
                style={{ '--tw-ring-color': accent } as any}
              />
              {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-extrabold text-sm hover:opacity-90 transition-all disabled:opacity-60"
                style={{ backgroundColor: accent }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                {content.buttonText || 'Enviar Mensaje'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Bloques por tipo: Calendar (landing), VSL (landing), Articles (corporativa)
// ═══════════════════════════════════════════════════════════════════════════

function extractVideoEmbed(videoUrl: string): { kind: 'youtube' | 'vimeo' | 'mp4' | 'none'; src: string } {
  if (!videoUrl) return { kind: 'none', src: '' }
  const yt = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` }
  const vm = videoUrl.match(/vimeo\.com\/(\d+)/)
  if (vm) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(videoUrl)) return { kind: 'mp4', src: videoUrl }
  return { kind: 'none', src: '' }
}

function CalendarSection({ content, settings, accent, businessSlug, pageId, editorMode }: {
  content: any
  settings: any
  accent: string
  businessSlug?: string
  pageId?: string
  editorMode?: boolean
}) {
  const integration = content.integration || 'internal'
  const bookingUrl = content.bookingUrl || ''

  // ── Calendly: agenda externa real embebida ──────────────────────────────
  if (integration === 'calendly' && bookingUrl) {
    return <CalendlyEmbed url={bookingUrl} />
  }

  const [selDate, setSelDate] = useState<string | null>(null)
  const [selTime, setSelTime] = useState<string | null>(null)
  const [taken, setTaken] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<null | { booking: any; googleCalendarUrl: string }>(null)
  const [error, setError] = useState('')

  // Cargar slots ocupados al elegir día (en el editor sin slug se muestran todos libres)
  useEffect(() => {
    if (!selDate || !businessSlug) { setTaken([]); return }
    let alive = true
    setSlotsLoading(true)
    fetch(`/api/v1/store/bookings/availability?business=${encodeURIComponent(businessSlug)}&date=${selDate}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setTaken(Array.isArray(d?.data?.taken) ? d.data.taken : []) })
      .catch(() => { if (alive) setTaken([]) })
      .finally(() => { if (alive) setSlotsLoading(false) })
    return () => { alive = false }
  }, [selDate, businessSlug])

  const days = useMemo(() => {
    const arr: Array<{ key: string; weekday: string; date: string; month: string }> = []
    const now = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(now)
      d.setDate(now.getDate() + i)
      arr.push({
        key: d.toISOString().slice(0, 10),
        weekday: d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
        date: String(d.getDate()),
        month: d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', ''),
      })
    }
    return arr
  }, [])

  const hours: string[] = Array.isArray(content.hours) ? content.hours : ['10:00', '16:00']
  const cols = settings?.columns === '3' ? 'grid-cols-3' : 'grid-cols-2'
  const waNumber = content.whatsappNumber || settings?.whatsappNumber || ''

  const confirmEnabled = !!selDate && !!selTime && form.name.trim().length > 0 && form.phone.trim().length > 0

  async function handleConfirm() {
    if (!selDate || !selTime || !confirmEnabled || editorMode) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/v1/store/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          date: selDate,
          time: selTime,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          message: form.message.trim() || undefined,
          pageId,
          duration: content.duration || '30',
          notificationEmail: content.notificationEmail || undefined,
          notificationWhatsapp: content.notificationWhatsapp || undefined,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d?.error || `Error (${res.status}). Intenta con otra hora.`)
        if (res.status === 409) setSelTime(null)
        return
      }
      setResult({ booking: d?.data?.booking, googleCalendarUrl: d?.data?.googleCalendarUrl || '' })
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (result) {
    const d = new Date(result.booking?.date + 'Z')
    const fecha = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
    const waLink = waNumber
      ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
          `Hola! Confirmo mi cita del ${fecha} a las ${result.booking?.slotTime}. Soy ${result.booking?.customerName}.`
        )}`
      : ''
    return (
      <div className="rounded-2xl border border-white/10 overflow-hidden text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="p-6 sm:p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${accent}22`, color: accent }}>
            ✓
          </div>
          <div>
            <h3 className="text-xl font-black">¡Cita reservada!</h3>
            <p className="text-sm opacity-70 mt-1">
              {fecha} a las <strong>{result.booking?.slotTime}</strong> · {result.booking?.customerName}
            </p>
            <p className="text-xs opacity-50 mt-2 max-w-md mx-auto">
              {integration === 'google'
                ? 'Añade el evento a tu calendario de Google con el botón de abajo. Te contactaremos para confirmar.'
                : 'Guarda el evento en tu calendario y te confirmaremos por WhatsApp.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            {result.googleCalendarUrl && (
              <a
                href={result.googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all hover:scale-105"
                style={{ backgroundColor: accent, color: '#0b0f1a', boxShadow: `0 12px 30px -12px ${accent}` }}
              >
                🗓 Añadir a Google Calendar
              </a>
            )}
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all border hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              >
                💬 Confirmar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: accent }}>
          Paso 1 · Elige el día
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map((d) => (
            <button
              key={d.key}
              onClick={() => { setSelDate(d.key); setSelTime(null) }}
              className={`rounded-xl px-1 py-2.5 text-center transition-all border ${
                selDate === d.key ? 'scale-105' : 'hover:bg-white/5'
              }`}
              style={selDate === d.key
                ? { backgroundColor: accent, borderColor: accent, color: '#0b0f1a' }
                : { borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <span className="block text-[10px] uppercase opacity-70">{d.weekday}</span>
              <span className="block text-lg font-black leading-tight">{d.date}</span>
              <span className="block text-[10px] uppercase opacity-70">{d.month}</span>
            </button>
          ))}
        </div>
      </div>

      {selDate && (
        <div className="p-4 sm:p-5 border-t border-white/10 animate-fade-in-down">
          <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: accent }}>
            Paso 2 · Elige la hora
          </p>
          {slotsLoading ? (
            <p className="text-xs opacity-50 py-2">Cargando disponibilidad…</p>
          ) : (
            <div className={`grid ${cols} gap-2`}>
              {hours.map((h) => {
                const busy = taken.includes(h)
                return (
                  <button
                    key={h}
                    disabled={busy}
                    onClick={() => setSelTime(h)}
                    title={busy ? 'Horario ocupado' : h}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-all border ${
                      busy
                        ? 'opacity-30 line-through cursor-not-allowed'
                        : selTime === h ? 'scale-105' : 'hover:bg-white/5'
                    }`}
                    style={selTime === h && !busy
                      ? { backgroundColor: accent, borderColor: accent, color: '#0b0f1a' }
                      : { borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          )}

          <div className="border-t border-white/10 mt-5 pt-5">
            <p className="text-xs font-extrabold uppercase tracking-widest mb-3" style={{ color: accent }}>
              Paso 3 · Tus datos
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo *"
                className="rounded-lg px-3 py-2.5 text-sm bg-white/5 border border-white/15 outline-none focus:border-white/40 placeholder:text-white/30"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Teléfono / WhatsApp *"
                inputMode="tel"
                className="rounded-lg px-3 py-2.5 text-sm bg-white/5 border border-white/15 outline-none focus:border-white/40 placeholder:text-white/30"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email (opcional)"
                inputMode="email"
                className="rounded-lg px-3 py-2.5 text-sm bg-white/5 border border-white/15 outline-none focus:border-white/40 placeholder:text-white/30"
              />
              <input
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Motivo / nota (opcional)"
                className="rounded-lg px-3 py-2.5 text-sm bg-white/5 border border-white/15 outline-none focus:border-white/40 placeholder:text-white/30"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>{error}</p>}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
            <p className="text-xs opacity-60">{content.note || 'Sesión de 30 minutos · Sin compromiso'}</p>
            {editorMode ? (
              <span className="text-[11px] font-bold px-3 py-2 rounded-lg border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}>
                Modo edición · la reserva se guarda en la versión publicada
              </span>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={!confirmEnabled || submitting}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-extrabold text-sm transition-all ${
                  confirmEnabled && !submitting ? 'hover:scale-105 active:scale-95' : 'opacity-50 pointer-events-none'
                }`}
                style={{ backgroundColor: accent, boxShadow: `0 12px 30px -12px ${accent}` }}
              >
                {submitting ? 'Reservando…' : content.buttonLabel || 'Confirmar reserva'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendlyEmbed({ url }: { url: string }) {
  let embedUrl = url.trim()
  if (!/^https?:\/\//i.test(embedUrl)) embedUrl = `https://calendly.com/${embedUrl.replace(/^\/+/, '')}`
  embedUrl = embedUrl.replace(/\/$/, '')
  const [domain, setDomain] = useState('')
  useEffect(() => { setDomain(window.location.hostname) }, [])
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <iframe
        src={`${embedUrl}?embed_domain=${domain}&embed_type=Inline`}
        width="100%"
        height="680"
        frameBorder="0"
        title="Calendly"
        className="w-full"
      />
    </div>
  )
}

function VslSection({ content, settings, accent }: { content: any; settings: any; accent: string }) {
  const [playing, setPlaying] = useState(false)
  const { kind, src } = extractVideoEmbed(content.videoUrl || '')
  const rounded = settings?.rounded || '16px'

  if (kind === 'none') {
    return (
      <div
        className="w-full aspect-video rounded-2xl border border-dashed border-white/20 flex items-center justify-center text-sm opacity-60"
        style={{ borderRadius: rounded }}
      >
        Configura una URL de video (YouTube, Vimeo o MP4)
      </div>
    )
  }

  return (
    <div
      className="relative w-full aspect-video overflow-hidden shadow-2xl"
      style={{ borderRadius: rounded, border: '1px solid rgba(255,255,255,0.12)' }}
    >
      {playing ? (
        kind === 'mp4' ? (
          <video src={src} controls autoPlay className="w-full h-full object-cover" />
        ) : (
          <iframe src={src} title="VSL" className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        )
      ) : (
        <button onClick={() => setPlaying(true)} className="w-full h-full group relative block cursor-pointer" aria-label="Reproducir video">
          {content.thumbnailUrl ? (
            <img src={content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }} />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: accent }}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white ml-1" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

function ArticlesSection({ content, settings, accent, businessSlug }: { content: any; settings: any; accent: string; businessSlug?: string }) {
  const source = content.source === 'blog' ? 'blog' : 'static'
  const cols = settings?.columns === '4' ? 'sm:grid-cols-2 lg:grid-cols-4' : settings?.columns === '2' ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  const showDate = settings?.showDate !== false
  const showReadMore = settings?.showReadMore !== false
  const dark = isDarkBg(settings?.backgroundColor || '#ffffff')

  // Modo 'blog': trae los artículos REALES publicados de la tienda (gestor de blog)
  const [livePosts, setLivePosts] = useState<any[] | null>(source === 'blog' ? [] : null)
  useEffect(() => {
    if (source !== 'blog') return
    let cancelled = false
    setLivePosts([])
    if (!businessSlug) { setLivePosts(null); return }
    fetch(`/api/v1/store/blog?business=${encodeURIComponent(businessSlug)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setLivePosts(Array.isArray(d?.data?.posts) ? d.data.posts : []) })
      .catch(() => { if (!cancelled) setLivePosts([]) })
    return () => { cancelled = true }
  }, [source, businessSlug])

  let articles: any[]
  if (source === 'blog') {
    if (livePosts === null) {
      return (
        <div className="text-center py-10 text-sm opacity-50 border border-dashed rounded-2xl">
          Los artículos publicados de tu tienda aparecerán aquí (gestor de blog → Artículos)
        </div>
      )
    }
    articles = (livePosts || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt,
      imageUrl: p.coverImage,
      date: p.publishedAt || p.updatedAt,
      tag: p.category,
      link: `/blog/${p.slug}`,
    }))
    if (articles.length === 0) {
      return (
        <div className="text-center py-10 text-sm opacity-50 border border-dashed rounded-2xl">
          Aún no hay artículos publicados en el blog de tu tienda
        </div>
      )
    }
  } else {
    articles = Array.isArray(content.articles) ? content.articles : []
    if (articles.length === 0) {
      return (
        <div className="text-center py-10 text-sm opacity-50 border border-dashed rounded-2xl">
          Agrega artículos desde el editor
        </div>
      )
    }
  }

  return (
    <div className={`grid ${cols} gap-5`}>
      {articles.map((a: any) => (
        <a
          key={a.id || a.title}
          href={a.link || '#'}
          className="group rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-xl"
          style={{ borderColor: 'rgba(128,128,128,0.18)', background: dark ? 'rgba(255,255,255,0.04)' : '#fff' }}
        >
          {a.imageUrl && (
            <div className="aspect-video overflow-hidden">
              <img src={a.imageUrl} alt={a.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
          )}
          <div className="p-4 space-y-2">
            {a.tag && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{ backgroundColor: softBg(accent, '18'), color: accent }}
              >
                {a.tag}
              </span>
            )}
            <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: dark ? '#fff' : '#0f172a' }}>
              {a.title}
            </h3>
            {a.excerpt && <p className="text-xs opacity-60 leading-relaxed line-clamp-3">{a.excerpt}</p>}
            <div className="flex items-center justify-between pt-1">
              {showDate && a.date && <span className="text-[10px] opacity-50">{new Date(a.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              {showReadMore && (
                <span className="text-[11px] font-extrabold" style={{ color: accent }}>
                  Leer más →
                </span>
              )}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Botón con destino configurable (ventana / ancla / externo / WhatsApp)
// ═══════════════════════════════════════════════════════════════════════════

function resolveLinkHref(link: any, fallback: any = { type: 'external', value: '#' }): { href: string; isWindow: boolean; value: string } {
  const l = link || fallback
  if (typeof l === 'string') return { href: l, isWindow: false, value: l }
  const t = l.type || 'external'
  const val = l.value || ''
  if (t === 'window') return { href: `#/ventana/${val}`, isWindow: true, value: val }
  if (t === 'anchor') return { href: val.startsWith('#') ? val : `#${val}`, isWindow: false, value: val }
  if (t === 'whatsapp') return { href: `https://wa.me/${String(val).replace(/\D/g, '')}`, isWindow: false, value: val }
  return { href: val || '#', isWindow: false, value: val }
}

function LinkButton({ link, fallback, children, className, style, editorMode, onNavigateWindow }: {
  link: any
  fallback?: any
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  editorMode?: boolean
  onNavigateWindow?: (w: string) => void
}) {
  const { href, isWindow, value } = resolveLinkHref(link, fallback)
  return (
    <a
      href={href}
      onClick={(e) => {
        if (!isWindow) return
        e.preventDefault()
        const win = value.replace('#/ventana/', '')
        if (editorMode) onNavigateWindow?.(win)
        else window.location.hash = `#/ventana/${win}`
      }}
      className={className}
      style={style}
    >
      {children}
    </a>
  )
}
