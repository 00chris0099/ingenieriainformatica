'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Package } from 'lucide-react';
import dynamic from 'next/dynamic';

const CheckoutModal = dynamic(() => import('@/components/checkout/CheckoutModal'), { ssr: false });
const LandingPageRenderer = dynamic(() => import('@/components/landing/LandingPageRenderer'), { ssr: false });

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [landingBlocks, setLandingBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/products/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            const p = data.data;
            setProduct({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price || 0,
              compareAtPrice: p.compareAtPrice || null,
              finalPrice: p.finalPrice || p.price || 0,
              discountPercent: p.discountPercent || 0,
              description: p.description || '',
              shortDescription: p.shortDescription || '',
              brand: p.brand || '',
              stock: p.stock || 0,
              category: p.category?.name || '',
              images: p.images || [],
              ctaText: p.ctaText || '¡Lo quiero ahora!',
              crossSellProductIds: p.crossSellProductIds || [],
              height: p.height,
              width: p.width,
              depth: p.depth,
              color: p.color || '',
              materials: p.materials || [],
              recommendedAge: p.recommendedAge || '',
              warrantyDays: p.warrantyDays,
              originCountry: p.originCountry || '',
              weight: p.weight,
              weightUnit: p.weightUnit || 'kg',
              tags: p.tags || [],
              discountPopup: p.discountPopup || null,
            });

            // Fetch landing page blocks
            try {
              const landingRes = await fetch(`/api/v1/landings/${p.slug}`);
              if (landingRes.ok) {
                const landingData = await landingRes.json();
                setLandingBlocks(landingData.data?.blocks || []);
              }
            } catch {}
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchProduct();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Package size={48} className="text-gray-300 mb-4" />
        <h1 className="text-xl font-bold mb-2">Producto no encontrado</h1>
        <p className="text-gray-500 mb-4">El producto que buscas no existe o fue removido.</p>
        <Link href="/tienda" className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12 md:h-16">
          <Link href="/" className="font-bold text-green-600">AdriSu Kids</Link>
          <Link href="/tienda" className="text-sm text-gray-500 hover:text-green-600">Ver tienda</Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 md:py-8 w-full">
        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-green-600">Inicio</Link>
          <ChevronRight size={12} />
          <Link href="/tienda" className="hover:text-green-600">Tienda</Link>
          {product.category && (
            <>
              <ChevronRight size={12} />
              <span className="text-gray-900">{product.category}</span>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-gray-900 truncate">{product.name}</span>
        </nav>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-12">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {product.images.length > 0 ? (
                <img src={product.images[selectedImage] || product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-gray-300" />
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 ${selectedImage === i ? 'border-green-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.brand && <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{product.name}</h1>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                {(() => {
                  const mainPrice = Number(product.price) || 0;
                  const fp = Number(product.finalPrice) || mainPrice;
                  const discPct = product.discountPercent || 0;
                  const showStrike = discPct > 0 && fp < mainPrice;
                  return (
                    <>
                      {showStrike && <span className="text-lg text-gray-400 line-through">S/ {mainPrice}</span>}
                      <span className="text-3xl font-bold text-pink-600">S/ {fp}</span>
                      {discPct > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">-{discPct}% OFF</span>}
                    </>
                  );
                })()}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* CTA Button */}
            <style>{`
              @keyframes cta-combined {
                0%, 100% { transform: scale(1); box-shadow: 0 0 5px rgba(34,197,94,0.3); }
                50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(34,197,94,0.6); }
              }
            `}</style>
            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors mb-4"
              style={{ animation: 'cta-combined 2s ease-in-out infinite' }}
            >
              {product.ctaText || '¡Lo quiero ahora!'}
            </button>

            {/* Product Details */}
            <div className="mt-8 space-y-4 border-t pt-6">
              {/* Specs */}
              {(product.height || product.width || product.depth || product.weight || product.color || product.recommendedAge || product.warrantyDays || product.originCountry) && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Especificaciones</h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {product.height && <tr><td className="py-2 text-gray-500">Alto</td><td className="py-2">{product.height} cm</td></tr>}
                      {product.width && <tr><td className="py-2 text-gray-500">Ancho</td><td className="py-2">{product.width} cm</td></tr>}
                      {product.depth && <tr><td className="py-2 text-gray-500">Profundidad</td><td className="py-2">{product.depth} cm</td></tr>}
                      {product.weight && <tr><td className="py-2 text-gray-500">Peso</td><td className="py-2">{product.weight} {product.weightUnit}</td></tr>}
                      {product.color && <tr><td className="py-2 text-gray-500">Color</td><td className="py-2">{product.color}</td></tr>}
                      {product.materials.length > 0 && <tr><td className="py-2 text-gray-500">Materiales</td><td className="py-2">{product.materials.join(', ')}</td></tr>}
                      {product.recommendedAge && <tr><td className="py-2 text-gray-500">Edad recomendada</td><td className="py-2">{product.recommendedAge}</td></tr>}
                      {product.warrantyDays && <tr><td className="py-2 text-gray-500">Garantia</td><td className="py-2">{product.warrantyDays} dias</td></tr>}
                      {product.originCountry && <tr><td className="py-2 text-gray-500">Origen</td><td className="py-2">{product.originCountry}</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Warranty */}
              {product.warrantyDays && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-2">Garantia</h3>
                  <p className="text-sm text-gray-600">{product.warrantyDays} dias de garantia contra defectos de fabricacion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Landing Page Blocks - outside main for full-width */}
      {landingBlocks.length > 0 && (
        <div className="mt-8 md:mt-12 border-t border-gray-100">
          <LandingPageRenderer blocks={landingBlocks} />
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <>
          {console.log('Product passed to CheckoutModal:', product)}
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            product={product}
          />
        </>
      )}
    </div>
  );
}
