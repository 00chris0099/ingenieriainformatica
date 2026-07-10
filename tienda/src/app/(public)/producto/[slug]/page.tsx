'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { Star, ChevronRight, Minus, Plus, Loader2, ShoppingCart, Heart, Share2, ChevronDown, Package } from 'lucide-react';
import CheckoutModal from '@/components/checkout/CheckoutModal';
import LandingPageRenderer from '@/components/landing/LandingPageRenderer';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [product, setProduct] = useState<any>(null);
  const [landingBlocks, setLandingBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/products/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            const p = data.data;
            const priceConfig = p.priceConfig || null;
            setProduct({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.variants?.[0]?.price || 0,
              compareAtPrice: p.variants?.[0]?.compareAtPrice || null,
              description: p.description || '',
              shortDescription: p.shortDescription || '',
              brand: p.brand || '',
              stock: p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0,
              category: p.category?.name || '',
              images: p.images || [],
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
              variants: p.variants || [],
              priceConfig,
              discountPopup: p.discountPopup || null,
            });

            // Fetch landing page blocks
            try {
              const landingRes = await fetch(`/landings/${p.slug}.json`);
              if (landingRes.ok) {
                const landingData = await landingRes.json();
                setLandingBlocks(landingData.blocks || []);
              }
            } catch {}
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchProduct();
  }, [params.slug]);

  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.variants[0];
    for (let i = 0; i < quantity; i++) {
      addItem({
        variantId: variant?.id || `${product.slug}-std`,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0] || '',
      });
    }
  };

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

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

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
          <div className="pb-24 md:pb-0">
            {product.brand && <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{product.name}</h1>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                {hasDiscount && <span className="text-lg text-gray-400 line-through">S/ {product.compareAtPrice}</span>}
                <span className="text-3xl font-bold text-green-600">S/ {product.price}</span>
                {hasDiscount && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">-{discountPercent}%</span>}
              </div>
              {/* Price config (especial / descuento / mayorista) */}
              {product.priceConfig?.enabledTypes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.priceConfig.enabledTypes.includes('especial') && product.priceConfig.especial && (
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-lg font-medium">Precio especial: S/ {product.priceConfig.especial}</span>
                  )}
                  {product.priceConfig.enabledTypes.includes('descuento') && product.priceConfig.descuento && (
                    <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-lg font-medium">{product.priceConfig.descuento}% OFF</span>
                  )}
                  {product.priceConfig.enabledTypes.includes('mayorista') && product.priceConfig.mayorista && (
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">Mayorista: S/ {product.priceConfig.mayorista}</span>
                  )}
                </div>
              )}
            </div>

            {/* Discount Popup Banner */}
            {product.discountPopup?.enabled && (
              <div className="mb-4 rounded-xl p-4 text-center" style={{ backgroundColor: product.discountPopup.bgColor, color: product.discountPopup.textColor }}>
                <p className="font-bold text-lg">{product.discountPopup.title}</p>
                <p className="text-sm opacity-90 mt-1">{product.discountPopup.description}</p>
                {product.discountPopup.discountPercent > 0 && (
                  <p className="text-2xl font-bold mt-2">-{product.discountPopup.discountPercent}% OFF</p>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border border-gray-200 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-50"><Minus size={16} /></button>
                <span className="px-4 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-gray-50"><Plus size={16} /></button>
              </div>
              <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                <ShoppingCart size={18} /> Agregar al carrito
              </button>
              <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50"><Heart size={18} className="text-gray-400" /></button>
            </div>

            {/* Share */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Share2 size={14} /> Compartir
            </div>

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

        {/* Tabs */}
        <div className="mt-8 md:mt-12 border-t border-gray-100 pt-8">
          <div className="flex gap-8 border-b border-gray-200">
            {(['description', 'specs', 'reviews'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'description' ? 'Descripcion' : tab === 'specs' ? 'Especificaciones' : 'Opiniones (0)'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />}
              </button>
            ))}
          </div>
          <div className="py-6">
            {activeTab === 'description' && (
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description || 'Sin descripcion disponible'}
              </div>
            )}
            {activeTab === 'specs' && (
              <div className="text-sm text-gray-500">
                {product.height || product.width ? (
                  <p>Ver especificaciones en la seccion de arriba.</p>
                ) : (
                  <p>Sin especificaciones disponibles.</p>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay resenas aun.</p>
              </div>
            )}
          </div>
        </div>

        {/* Landing Page Blocks */}
        {landingBlocks.length > 0 && (
          <div className="mt-8 md:mt-12 border-t border-gray-100 pt-8">
            <LandingPageRenderer blocks={landingBlocks} />
          </div>
        )}
      </main>

      {/* Checkout Modal */}
      {checkoutOpen && <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}
