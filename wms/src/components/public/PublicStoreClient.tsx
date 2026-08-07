'use client'

import React, { useState } from 'react'
import { IconRenderer } from '@/components/ui/IconRenderer'
import { X, ShoppingBag, Check, Plus, Minus, MessageSquare, Star, ArrowRight, ShieldCheck } from 'lucide-react'

interface PublicStoreClientProps {
  pageTitle: string
  blocks: any[]
}

export default function PublicStoreClient({ pageTitle, blocks }: PublicStoreClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [cartCount, setCartCount] = useState<number>(0)
  const [showNotification, setShowNotification] = useState<boolean>(false)

  const handleOpenProduct = (p: any) => {
    setSelectedProduct(p)
    setSelectedSize(Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : '')
    setQuantity(1)
  }

  const handleAddToCart = () => {
    setCartCount(prev => prev + quantity)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
    setSelectedProduct(null)
  }

  const buildWhatsappUrl = (p: any) => {
    const sizeText = selectedSize ? `%20-%20Talla:%20${encodeURIComponent(selectedSize)}` : ''
    const qtyText = `%20-%20Cantidad:%20${quantity}`
    const text = `Hola,%20deseo%20comprar%20el%20producto:%20${encodeURIComponent(p.name)}${sizeText}${qtyText}%20-%20Precio:%20${encodeURIComponent(p.price)}`
    return `https://wa.me/51999888777?text=${text}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white relative">
      {/* Toast Notification */}
      {showNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Check size={18} className="font-bold" />
          <span className="text-xs font-bold">¡Producto añadido al carrito con éxito!</span>
        </div>
      )}

      {/* Floating Cart Counter Badge */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => alert(`Tienes ${cartCount} productos en tu carrito. Puedes finalizar tu pedido directamente por WhatsApp.`)}
          className="bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-full shadow-2xl border-2 border-white/20 flex items-center justify-center relative hover:scale-110 active:scale-95 transition-all"
        >
          <ShoppingBag size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <main>
        {blocks.map((b) => {
          const s = b.settings || {}
          const c = b.content || {}

          if (b.type === 'navbar') {
            const links = Array.isArray(c.links) ? c.links : []
            return (
              <header
                key={b.id}
                style={{ backgroundColor: s.backgroundColor || '#ffffff', color: s.textColor || '#111827' }}
                className="sticky top-0 z-40 border-b border-slate-200 shadow-sm"
              >
                {c.announcement && (
                  <div
                    style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                    className="text-center py-2 px-4 text-xs font-extrabold text-white uppercase tracking-wider"
                  >
                    {c.announcement}
                  </div>
                )}
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 font-black text-xl tracking-tight text-slate-900">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                    {c.brandName || pageTitle || 'TIENDA VIRTUAL'}
                  </div>

                  <nav className="flex items-center gap-2 flex-wrap">
                    {links.map((link: any, idx: number) => (
                      <a
                        key={idx}
                        href={`#${link.windowId || 'productos'}`}
                        onClick={() => {
                          if (link.windowId && link.windowId !== 'home') {
                            setActiveCategory(link.windowId)
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-all inline-flex items-center gap-1.5"
                      >
                        <IconRenderer name={link.iconName} size={14} />
                        {link.label}
                      </a>
                    ))}
                  </nav>
                </div>
              </header>
            )
          }

          if (b.type === 'hero') {
            return (
              <section
                key={b.id}
                style={{ backgroundColor: s.backgroundColor || '#0f172a', color: s.textColor || '#fff', paddingTop: `${s.paddingY || 96}px`, paddingBottom: `${s.paddingY || 96}px` }}
                className="px-6 text-center relative overflow-hidden"
              >
                <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                  {c.badge && (
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                      {c.badge}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                    {c.title || 'Moda & Tendencias'}
                  </h1>
                  <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
                    {c.subtitle || 'Descubre prendas únicas diseñadas para destacar.'}
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
                    <a
                      href="#productos"
                      style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                      className="px-8 py-4 rounded-xl text-white font-extrabold text-base shadow-xl shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
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
                </div>
              </section>
            )
          }

          if (b.type === 'product-grid') {
            const allProducts = Array.isArray(c.products) ? c.products : []
            const tabs = Array.isArray(c.categoryTabs) ? c.categoryTabs : []

            const filteredProducts = activeCategory === 'all'
              ? allProducts
              : allProducts.filter((p: any) => p.category === activeCategory)

            return (
              <section
                key={b.id}
                id="productos"
                style={{ backgroundColor: s.backgroundColor || '#ffffff', color: s.textColor || '#111827', paddingTop: `${s.paddingY || 72}px`, paddingBottom: `${s.paddingY || 72}px` }}
                className="px-6"
              >
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">{c.title || 'Catálogo de Productos'}</h2>
                    {c.subtitle && <p className="text-slate-500 text-sm max-w-md mx-auto">{c.subtitle}</p>}
                  </div>

                  {/* Interactive Multi-Window Category Tabs */}
                  {tabs.length > 0 && (
                    <div className="flex items-center justify-center gap-2 flex-wrap pb-4">
                      {tabs.map((tab: any, idx: number) => {
                        const active = activeCategory === tab.id || (activeCategory === 'all' && idx === 0)
                        return (
                          <button
                            key={tab.id || idx}
                            onClick={() => setActiveCategory(tab.id)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                              active
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredProducts.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => handleOpenProduct(p)}
                        className="p-6 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
                      >
                        {p.discountBadge && (
                          <span className="absolute top-4 right-4 bg-rose-50 text-rose-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-rose-200 z-10">
                            {p.discountBadge}
                          </span>
                        )}
                        <div>
                          <div className="h-52 mb-5 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform text-rose-500 relative">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <IconRenderer name={p.iconName || 'Shirt'} size={56} />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
                                Vista Rápida
                              </span>
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
                            <span className="text-2xl font-black text-rose-500">{p.price}</span>
                            {p.originalPrice && <span className="text-xs text-slate-400 line-through">{p.originalPrice}</span>}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenProduct(p)
                          }}
                          style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                          className="w-full text-center text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all inline-flex items-center justify-center gap-2"
                        >
                          <ShoppingBag size={15} />
                          Comprar Ahora
                        </button>
                      </div>
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
                style={{ backgroundColor: s.backgroundColor || '#f8fafc', color: s.textColor || '#0f172a', paddingTop: `${s.paddingY || 64}px`, paddingBottom: `${s.paddingY || 64}px` }}
                className="px-6 border-t border-slate-100"
              >
                <div className="max-w-6xl mx-auto space-y-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-center text-slate-900">{c.title || 'Beneficios Exclusivos'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                          <IconRenderer name={item.iconName || 'ShieldCheck'} size={24} />
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900">{item.title || 'Beneficio'}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.description || ''}</p>
                      </div>
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
                style={{ backgroundColor: s.backgroundColor || '#ffffff', color: s.textColor || '#0f172a', paddingTop: `${s.paddingY || 64}px`, paddingBottom: `${s.paddingY || 64}px` }}
                className="px-6 border-t border-slate-100"
              >
                <div className="max-w-5xl mx-auto space-y-8">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-center text-slate-900">{c.title || 'Opiniones de nuestros Clientes'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((t: any, idx: number) => (
                      <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className="fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs italic text-slate-600 leading-relaxed">"{t.text || t.comment || ''}"</p>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{t.name || 'Cliente'}</div>
                          <div className="text-[10px] text-slate-400">{t.role || 'Comprador verificado'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          }

          if (b.type === 'cta') {
            return (
              <section
                key={b.id}
                id="ofertas"
                style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                className="px-6 py-20 text-center text-white"
              >
                <div className="max-w-3xl mx-auto space-y-6">
                  <h2 className="text-3xl md:text-5xl font-black">{c.title || '¡Promoción Especial!'}</h2>
                  <p className="text-base opacity-90 leading-relaxed max-w-xl mx-auto">{c.description || ''}</p>
                  <a
                    href="https://wa.me/51999888777"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-rose-600 px-9 py-4 rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all"
                  >
                    <MessageSquare size={18} />
                    {c.buttonText || 'Obtener Oferta por WhatsApp'}
                  </a>
                </div>
              </section>
            )
          }

          if (b.type === 'footer') {
            return (
              <footer
                key={b.id}
                style={{ backgroundColor: s.backgroundColor || '#0f172a', color: s.textColor || '#fff' }}
                className="px-6 py-12 text-center border-t border-slate-800 space-y-4"
              >
                <div className="max-w-5xl mx-auto space-y-2">
                  <h3 className="text-xl font-black tracking-wider">{c.brandName || 'TIENDA VIRTUAL'}</h3>
                  <p className="text-xs opacity-60">{c.copyright || '© 2026 Todos los derechos reservados. Impulsado por WMS Platform.'}</p>
                </div>
              </footer>
            )
          }

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
              {/* Product Photo */}
              <div className="h-64 md:h-full min-h-[220px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <IconRenderer name={selectedProduct.iconName || 'Shirt'} size={72} className="text-rose-500" />
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                    {selectedProduct.discountBadge || 'PRODUCTO DESTACADO'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{selectedProduct.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedProduct.description || 'Prenda de alta durabilidad con acabados nivel exportación.'}</p>

                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-3xl font-black text-rose-500">{selectedProduct.price}</span>
                    {selectedProduct.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">{selectedProduct.originalPrice}</span>
                    )}
                  </div>
                </div>

                {/* Size Selector */}
                {Array.isArray(selectedProduct.sizes) && selectedProduct.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Selecciona tu Talla:</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedProduct.sizes.map((sz: string) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            selectedSize === sz
                              ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Counter */}
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

                {/* Buttons */}
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
                    onClick={handleAddToCart}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag size={16} />
                    Añadir al Carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
