'use client'

import { Block, ThemeConfig } from '@repo/blocks'

interface Props { block: Block; theme?: ThemeConfig }

export function ImageBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <section className="py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {content.src ? (
          <img src={content.src} alt={content.alt || ''} className="w-full rounded-xl" />
        ) : (
          <div className="bg-gray-100 h-64 flex items-center justify-center rounded-xl text-gray-400">Sin imagen</div>
        )}
        {content.alt && <p className="text-sm text-center mt-2" style={{ color: theme?.colors?.muted || '#6b7280' }}>{content.alt}</p>}
      </div>
    </section>
  )
}

export function GalleryBlock({ block, theme }: Props) {
  const { content } = block
  const images = content.images || []
  const columns = block.settings.columns || 3
  return (
    <section className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {content.title && <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme?.colors?.text || '#111827' }}>{content.title}</h2>}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {images.map((img: any, i: number) => (
            <img key={i} src={img.src || img} alt={img.alt || ''} className="w-full h-48 object-cover rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ColumnsBlock({ block, theme }: Props) {
  const { content } = block
  const items = content.items || []
  const cols = block.settings.columns || 3
  return (
    <section className="py-12 px-6">
      <div className="max-w-6xl mx-auto grid gap-8" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {items.map((item: any, i: number) => (
          <div key={i}>
            {item.title && <h3 className="font-bold text-lg mb-2" style={{ color: theme?.colors?.text || '#111827' }}>{item.title}</h3>}
            <p style={{ color: theme?.colors?.muted || '#6b7280' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ContactBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <section className="py-16 px-6" style={{ backgroundColor: theme?.colors?.background || '#f9fafb' }}>
      <div className="max-w-xl mx-auto">
        {content.title && <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme?.colors?.text || '#111827' }}>{content.title}</h2>}
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Nombre" className="px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': theme?.colors?.primary || '#2563eb' } as any} />
            <input type="email" placeholder="Email" className="px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2" style={{ '--tw-ring-color': theme?.colors?.primary || '#2563eb' } as any} />
          </div>
          <input type="tel" placeholder="Telefono" className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none" />
          <textarea placeholder="Mensaje" rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm outline-none resize-none" />
          <button type="submit" className="w-full py-3 text-white font-semibold rounded-lg transition-colors" style={{ backgroundColor: theme?.colors?.primary || '#2563eb' }}>
            {content.buttonText || 'Enviar Mensaje'}
          </button>
        </form>
      </div>
    </section>
  )
}

export function FooterBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: block.settings.backgroundColor || theme?.colors?.secondary || '#111827', color: '#ffffff' }}>
      <div className="max-w-6xl mx-auto text-center">
        {content.companyName && <h3 className="text-xl font-bold mb-2">{content.companyName}</h3>}
        {content.tagline && <p className="text-sm opacity-70 mb-4">{content.tagline}</p>}
        {content.copyright && <p className="text-xs opacity-50">{content.copyright}</p>}
      </div>
    </footer>
  )
}

export function ProductGridBlock({ block, theme }: Props) {
  const { content, settings } = block
  const columns = Number(settings.columns) || 4
  const paddingY = settings.paddingY || '80px'
  const [products, setProducts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/v1/products?limit=12')
        if (res.ok) {
          const data = await res.json()
          const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
          setProducts(items)
        }
      } catch (err) {
        console.error('Error loading products for block:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [])

  return (
    <section className="px-6" style={{ paddingTop: paddingY, paddingBottom: paddingY, backgroundColor: settings.backgroundColor || theme?.colors?.background || '#ffffff' }}>
      <div className="max-w-6xl mx-auto">
        {content.title && <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: theme?.colors?.text || '#111827' }}>{content.title}</h2>}
        {content.subtitle && <p className="text-center mb-8 text-sm md:text-base" style={{ color: theme?.colors?.muted || '#6b7280' }}>{content.subtitle}</p>}

        {loading ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))` }}>
            {products.map((p) => {
              const mainImg = p.images?.[0] || '/images/placeholder.svg'
              const price = Number(p.price || 0)
              const compareAt = Number(p.compareAtPrice || 0)
              const hasDiscount = compareAt > price

              return (
                <div key={p.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img src={mainImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {hasDiscount && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase text-white bg-pink-600 rounded-full shadow">
                        Oferta
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-gray-100 mb-1">{p.name}</h3>
                      {p.shortDescription && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{p.shortDescription}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        {hasDiscount && (
                          <span className="text-[11px] text-gray-400 line-through block">S/ {compareAt.toFixed(2)}</span>
                        )}
                        <span className="text-base font-bold text-pink-600 dark:text-pink-400">S/ {price.toFixed(2)}</span>
                      </div>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Hola! Me interesa comprar: ${p.name} (S/ ${price.toFixed(2)})`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow"
                      >
                        Pedir
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center mt-6 text-sm text-gray-500">
            {content.emptyText || 'No hay productos disponibles en el catálogo en este momento.'}
          </p>
        )}
      </div>
    </section>
  )
}

export function CountdownBlock({ block, theme }: Props) {
  const { content } = block
  return (
    <section className="py-16 px-6 text-center" style={{ backgroundColor: block.settings.backgroundColor || '#1f2937', color: '#ffffff' }}>
      <div className="max-w-2xl mx-auto">
        {content.title && <h2 className="text-2xl font-bold mb-4">{content.title}</h2>}
        {content.subtitle && <p className="opacity-70 mb-6">{content.subtitle}</p>}
        <p className="text-sm opacity-50">Cuenta regresiva: {content.endDate || 'Sin fecha'}</p>
      </div>
    </section>
  )
}

export function SocialProofBlock({ block, theme }: Props) {
  const { content } = block
  const items = content.items || []
  return (
    <section className="py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {content.title && <p className="text-sm mb-6" style={{ color: theme?.colors?.muted || '#6b7280' }}>{content.title}</p>}
        <div className="flex flex-wrap justify-center gap-8 opacity-50">
          {items.map((item: any, i: number) => (
            <span key={i} className="text-lg font-bold" style={{ color: theme?.colors?.text || '#111827' }}>{item.name}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AccordionBlock({ block, theme }: Props) {
  const { content } = block
  const items = content.items || []
  return (
    <section className="py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-3">
        {content.title && <h2 className="text-2xl font-bold text-center mb-8" style={{ color: theme?.colors?.text || '#111827' }}>{content.title}</h2>}
        {items.map((item: any, i: number) => (
          <details key={i} className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer font-medium hover:bg-gray-50 text-sm">{item.question || item.title}</summary>
            <div className="px-4 pb-4 text-sm" style={{ color: theme?.colors?.muted || '#6b7280' }}>{item.answer || item.content}</div>
          </details>
        ))}
      </div>
    </section>
  )
}
