import { notFound } from 'next/navigation'
import { pageStore } from '@/lib/pageStore'
import { prisma } from '@repo/prisma'
import { Block } from '@repo/blocks'

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

            if (b.type === 'hero') {
              return (
                <section
                  key={b.id}
                  style={{ backgroundColor: s.backgroundColor || '#0f172a', color: s.textColor || '#fff', paddingTop: `${s.paddingY || 96}px`, paddingBottom: `${s.paddingY || 96}px` }}
                  className="px-6 text-center relative overflow-hidden"
                >
                  <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                    <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                      Colección Exclusiva 2026
                    </span>
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
                        {c.buttonText || 'Ver Colección'}
                      </a>
                      {c.secondaryButtonText && (
                        <a
                          href="#nosotros"
                          className="px-7 py-4 rounded-xl text-white font-bold text-base bg-white/10 border border-white/20 hover:bg-white/20 transition-all inline-flex items-center gap-2"
                        >
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
              return (
                <section
                  key={b.id}
                  id="productos"
                  style={{ backgroundColor: s.backgroundColor || '#ffffff', color: s.textColor || '#111827', paddingTop: `${s.paddingY || 72}px`, paddingBottom: `${s.paddingY || 72}px` }}
                  className="px-6"
                >
                  <div className="max-w-6xl mx-auto space-y-10">
                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-extrabold tracking-tight">{c.title || 'Catálogo de Productos'}</h2>
                      <p className="text-slate-500 text-sm">Explora nuestros productos con envío el mismo día</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {products.map((p: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                          <div>
                            <div className="text-6xl mb-4 text-center py-6 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                              {p.emoji || '🛍️'}
                            </div>
                            <h3 className="font-bold text-base mb-1 text-slate-900">{p.name}</h3>
                            <div className="text-2xl font-black text-rose-500 mb-4">{p.price}</div>
                          </div>
                          <a
                            href={`https://wa.me/51999888777?text=Hola,%20deseo%20comprar%20el%20producto:%20${encodeURIComponent(p.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ backgroundColor: s.accentColor || '#f43f5e' }}
                            className="w-full text-center text-white py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-all"
                          >
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
                  className="px-6"
                >
                  <div className="max-w-6xl mx-auto space-y-8">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Beneficios Exclusivos'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                          <div className="text-4xl">{item.icon || '✨'}</div>
                          <h3 className="font-bold text-base text-slate-900">{item.title || 'Beneficio'}</h3>
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
                    <h2 className="text-2xl md:text-3xl font-extrabold text-center">{c.title || 'Opiniones de nuestros Clientes'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {items.map((t: any, idx: number) => (
                        <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="text-amber-500 font-bold">★★★★★</div>
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
                    <h2 className="text-3xl md:text-4xl font-black">{c.title || '¡Promoción Especial!'}</h2>
                    <p className="text-base opacity-90 leading-relaxed max-w-xl mx-auto">{c.description || ''}</p>
                    <a
                      href="https://wa.me/51999888777"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-rose-600 px-8 py-4 rounded-xl font-black text-base shadow-2xl hover:scale-105 transition-all"
                    >
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
