'use client'

import React, { useEffect, useRef, useState } from 'react'
import { IconRenderer } from '@/components/ui/IconRenderer'
import { X, ShoppingBag, Check, Plus, Minus, MessageSquare, Star, Trash2 } from 'lucide-react'

interface PublicStoreClientProps {
  pageTitle: string
  blocks: any[]
  settings?: Record<string, any>
  seo?: Record<string, any>
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

/** Parse 'S/ 59.90' -> 59.9 (tolerates commas/dots and bare numbers) */
function parsePrice(label: any): number {
  if (typeof label === 'number') return label
  const m = String(label || '').match(/(\d+[.,]\d+|\d+)/)
  return m ? parseFloat((m[1] || '0').replace(',', '.')) : 0
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

export default function PublicStoreClient({ pageTitle, blocks, settings, seo }: PublicStoreClientProps) {
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

  // Multi-window state: a selected product opens its own landing "window"
  const [productWindow, setProductWindow] = useState<any | null>(null)
  const [productWindowCategory, setProductWindowCategory] = useState<string>('all')

  const closeNav = () => setNavOpen(false)

  const navigateTo = (windowId: string) => {
    setNavOpen(false)
    if (windowId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (windowId.startsWith('product:')) {
      const pid = windowId.replace('product:', '')
      const all = blocks
        .flatMap((b: any) => (Array.isArray(b?.content?.products) ? b.content.products : []))
      const found = all.find((p: any) => String(p.id) === pid)
      if (found) {
        handleOpenProduct(found)
        return
      }
    }
    setActiveCategory(windowId)
    const el = document.getElementById('productos')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cartCount = cart.reduce((acc, it) => acc + it.qty, 0)
  const cartTotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0)

  const notify = (msg: string) => {
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 2600)
  }

  const handleOpenProduct = (p: any) => {
    setSelectedProduct(p)
    setProductWindow(p)
    setProductWindowCategory(p.category || 'all')
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
      (it) => `- ${it.name}${it.size ? ` (Talla: ${it.size})` : ''} x${it.qty} = S/ ${(it.price * it.qty).toFixed(2)}`
    )
    const message = `Hola! Deseo completar mi pedido:\n${lines.join('\n')}\n\nTotal: S/ ${cartTotal.toFixed(2)}`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
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
        {blocks.map((b, bIdx) => {
          const s = b.settings || {}
          const c = b.content || {}
          const accent = s.accentColor || settings?.accentColor || settings?.primaryColor || '#f43f5e'

          if (b.type === 'navbar') {
            const links = Array.isArray(c.links) ? c.links : []
            const navBg = s.backgroundColor || '#ffffff'
            const navText = s.textColor || '#111827'
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
                  <button
                    onClick={() => navigateTo('home')}
                    className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight hover:opacity-80 transition-opacity"
                    style={{ color: navText }}
                  >
                    <span className="w-3 h-3 rounded-full inline-block animate-pulse" style={{ backgroundColor: accent }} />
                    <span className="truncate">{c.brandName || seo?.title || pageTitle || 'TIENDA VIRTUAL'}</span>
                  </button>

                  {/* Desktop nav */}
                  <nav className="hidden md:flex items-center gap-1">
                    {links.map((link: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(link.windowId || 'productos')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 hover:opacity-70 ${
                          activeCategory === link.windowId ? 'opacity-100' : 'opacity-80'
                        }`}
                        style={activeCategory === link.windowId ? { backgroundColor: softBg(accent, '14'), color: accent } : { color: navText }}
                      >
                        <IconRenderer name={link.iconName} size={14} />
                        {link.label}
                      </button>
                    ))}
                    {/* Cart button in navbar */}
                    <button
                      onClick={() => setCartOpen(true)}
                      className="relative ml-2 p-2 rounded-xl transition-all hover:opacity-80 inline-flex items-center gap-1.5"
                      style={{ color: navText, backgroundColor: softBg(accent, '10') }}
                      aria-label="Abrir carrito"
                    >
                      <ShoppingBag size={15} />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center border border-slate-950">
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

                {/* Mobile nav drawer */}
                {navOpen && (
                  <nav
                    className="md:hidden border-t animate-fade-in-down px-4 py-3 space-y-1"
                    style={{ backgroundColor: navBg, borderColor: 'rgba(128,128,128,0.15)' }}
                  >
                    {links.map((link: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(link.windowId || 'productos')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 hover:opacity-70"
                        style={{ color: navText }}
                      >
                        <IconRenderer name={link.iconName} size={14} />
                        {link.label}
                      </button>
                    ))}
                  </nav>
                )}
              </header>
            )
          }

          if (b.type === 'hero') {
            return (
              <section
                key={b.id}
                style={{
                  backgroundColor: s.backgroundColor || '#0f172a',
                  color: s.textColor || '#fff',
                  paddingTop: `${s.paddingY || 96}px`,
                  paddingBottom: `${s.paddingY || 96}px`,
                  '--accent': accent,
                } as React.CSSProperties}
                className="px-6 text-center relative overflow-hidden"
              >
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
                      <a
                        href="#productos"
                        style={{ backgroundColor: accent, boxShadow: `0 16px 40px -14px ${accent}` }}
                        className="px-8 py-4 rounded-xl text-white font-extrabold text-base hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                      >
                        <IconRenderer name="ShoppingBag" size={18} />
                        {c.buttonText || 'Ver Catálogo'}
                      </a>
                      {c.secondaryButtonText && (
                        <a
                          href="#ofertas"
                          className="px-7 py-4 rounded-xl text-white font-bold text-base bg-white/10 border border-white/20 hover:bg-white/20 transition-all inline-flex items-center gap-2"
                        >
                          <IconRenderer name="Flame" size={18} />
                          {c.secondaryButtonText}
                        </a>
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
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white px-9 py-4 rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all"
                      style={{ color: accent }}
                    >
                      <MessageSquare size={18} />
                      {c.buttonText || 'Obtener Oferta por WhatsApp'}
                    </a>
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
              <ContactBlock key={b.id} content={c} settings={s} accent={accent} whatsappNumber={whatsappNumber} />
            )
          }

          if (b.type === 'footer') {
            return (
              <footer
                key={b.id}
                style={{ backgroundColor: s.backgroundColor || '#0f172a', color: s.textColor || '#fff' }}
                className="px-6 py-12 text-center border-t border-white/10 space-y-4"
              >
                <div className="max-w-5xl mx-auto space-y-2">
                  <h3 className="text-xl font-black tracking-wider">{c.brandName || 'TIENDA VIRTUAL'}</h3>
                  <p className="text-xs opacity-60">{c.copyright || '© 2026 Todos los derechos reservados. Impulsado por WMS Platform.'}</p>
                </div>
              </footer>
            )
          }

          // Known blocks without a template-level renderer are skipped gracefully
          return null
        })}
      </main>

      {/* ═══════════════ ENTERPRISE QUICK VIEW PRODUCT MODAL ═══════════════ */}
      {selectedProduct && (
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
                          S/ {(it.price * it.qty).toFixed(2)}
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
              <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Total</span>
                  <span className="text-2xl font-black" style={{ color: rootAccent }}>
                    S/ {cartTotal.toFixed(2)}
                  </span>
                </div>
                <a
                  href={buildCartWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={16} />
                  Completar Pedido por WhatsApp
                </a>
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

function ContactBlock({ content, settings, accent, whatsappNumber }: { content: any; settings: any; accent: string; whatsappNumber: string }) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
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
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm space-y-4">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
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
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="¿En qué podemos ayudarte?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-slate-900 focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': accent } as any}
            />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-extrabold text-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: accent }}
            >
              <MessageSquare size={16} />
              {content.buttonText || 'Enviar por WhatsApp'}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
