import { notFound } from 'next/navigation'
import { pageStore } from '@/lib/pageStore'
import { prisma } from '@repo/prisma'
import { Block } from '@repo/blocks'
import { IconRenderer } from '@/components/ui/IconRenderer'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params
  let title = 'Tienda Virtual'
  let description = 'Pagina creada en WMS Platform'

  if (pageStore.has(id)) {
    const p = pageStore.get(id)
    title = p.title || title
    description = p.description || description
  } else {
    try {
      const p = await prisma.page.findFirst({
        where: { OR: [{ id }, { slug: id }] }
      })
      if (p) {
        title = p.title
        description = p.description || description
      }
    } catch {}
  }

  return { title, description }
}

export default async function PublicPageRenderer({ params }: { params: { id: string } }) {
  const { id } = params
  let page: any = null

  if (pageStore.has(id)) {
    page = pageStore.get(id)
  } else {
    try {
      page = await prisma.page.findFirst({
        where: { OR: [{ id }, { slug: id }] }
      })
    } catch {}
  }

  if (!page) {
    notFound()
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {blocks.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-extrabold mb-2">{page.title}</h1>
          <p className="text-slate-400 text-sm max-w-md">Esta tienda está publicada pero aún no contiene bloques. Edítala en el Diseñador Visual.</p>
        </div>
      ) : (
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
                  className="sticky top-0 z-50 border-b border-slate-200 shadow-sm"
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
                      {c.brandName || 'TIENDA VIRTUAL'}
                    </div>

                    <nav className="flex items-center gap-2 flex-wrap">
                      {links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={`#${link.windowId || 'home'}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-all inline-flex items-center gap-1.5"
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
              const products = Array.isArray(c.products) ? c.products : []
              const tabs = Array.isArray(c.categoryTabs) ? c.categoryTabs : []
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

                    {/* Multi-Window Category Tabs */}
                    {tabs.length > 0 && (
                      <div className="flex items-center justify-center gap-2 flex-wrap pb-4">
                        {tabs.map((tab: any, idx: number) => (
                          <button
                            key={tab.id || idx}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${idx === 0 ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {products.map((p: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group">
                          {p.discountBadge && (
                            <span className="absolute top-4 right-4 bg-rose-50 text-rose-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-rose-200">
                              {p.discountBadge}
                            </span>
                          )}
                          <div>
                            <div className="h-44 mb-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform text-rose-500">
                              <IconRenderer name={p.iconName || 'Shirt'} size={56} />
                            </div>
                            <h3 className="font-extrabold text-base mb-1.5 text-slate-900 leading-snug">{p.name}</h3>
                            {p.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.description}</p>}

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

                          <a
                            href={`https://wa.me/51999888777?text=Hola,%20deseo%20comprar%20el%20producto:%20${encodeURIComponent(p.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                            className="w-full text-center text-white py-3.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all inline-flex items-center justify-center gap-2"
                          >
                            <IconRenderer name="MessageSquare" size={15} />
                            Pedir por WhatsApp
                          </a>
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
                              <IconRenderer key={i} name="Star" size={14} className="fill-amber-400" />
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
                      <IconRenderer name="MessageSquare" size={18} />
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
      )}
    </div>
  )
}
