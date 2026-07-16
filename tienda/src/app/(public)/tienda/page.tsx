'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Loader2, Search, Package } from 'lucide-react';
import { expandSearch } from '@/lib/search-synonyms';

const defaultCategories = [
  { name: 'Todos', slug: '' },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-5 bg-gray-100 rounded w-1/4 mt-2" />
      </div>
    </div>
  );
}

function TiendaContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('categoria') || '';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name'>('newest');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/v1/categories');
        if (res.ok) {
          const data = await res.json();
          const cats = data.data || data || [];
          if (Array.isArray(cats) && cats.length > 0) {
            setCategories([{ name: 'Todos', slug: '' }, ...cats.map((c: any) => ({ name: c.name, slug: c.slug }))]);
          }
        }
      } catch { /* use default */ }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (activeCategory) params.set('category', activeCategory);
        if (search) params.set('q', search);
        const res = await fetch(`/api/v1/products?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data?.length) {
            setProducts(data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.variants?.[0]?.price || 0,
              compareAtPrice: p.variants?.[0]?.compareAtPrice,
              image: p.images?.[0] || '',
              category: p.category?.slug || '',
              stock: p.variants?.reduce((s: number, v: any) => s + (v.stock || 0), 0) || 0,
              priceConfig: p.priceConfig || null,
            })));
          }
        }
      } catch { /* use fallback */ }
      setLoading(false);
    }
    fetchProducts();
  }, [activeCategory, search]);

  // Client-side filtering and sorting with synonyms
  let filtered = products;
  if (activeCategory) filtered = filtered.filter((p) => p.category === activeCategory);
  if (search) {
    const terms = expandSearch(search);
    const q = search.toLowerCase();
    filtered = filtered.filter((p) => {
      const name = p.name.toLowerCase();
      return terms.some((t) => name.includes(t)) || name.includes(q);
    });
  }

  switch (sortBy) {
    case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
    case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
    case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break; // newest - already sorted from API
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
        <h1 className="text-3xl font-extrabold mb-2">
          {activeCategory ? categories.find((c) => c.slug === activeCategory)?.name || 'Tienda' : 'Nuestra Tienda'}
        </h1>
        <p className="text-gray-500 mb-6">{filtered.length} productos</p>

        {/* Category filters - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
          {categories.map((cat) => (
            <Link key={cat.slug} href={cat.slug ? `/tienda?categoria=${cat.slug}` : '/tienda'}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.slug || (!activeCategory && !cat.slug) ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{cat.name}</Link>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
            <option value="newest">Mas recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <Link key={product.id} href={`/producto/${product.slug}`}
                className="product-card bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
                <div className="aspect-square bg-gradient-to-br from-brand-50 to-pink-50 flex items-center justify-center overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 md:p-4">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mt-0.5">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const mainPrice = Number(product.price) || 0;
                      const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
                      const hasVariantDiscount = comparePrice && comparePrice > mainPrice;
                      const hasDesc = product.priceConfig?.enabledTypes?.includes('descuento') && product.priceConfig?.descuento != null && product.priceConfig.descuento > 0;
                      const hasEsp = product.priceConfig?.enabledTypes?.includes('especial') && product.priceConfig?.especial != null;
                      const finalPrice = hasEsp ? Number(product.priceConfig.especial) : hasDesc ? Math.round(mainPrice * (1 - product.priceConfig.descuento / 100) * 100) / 100 : mainPrice;
                      const showStrike = hasVariantDiscount || ((hasDesc || hasEsp) && finalPrice < mainPrice);
                      const strikePrice = hasVariantDiscount ? comparePrice : mainPrice;
                      const discountPercent = hasVariantDiscount ? Math.round((1 - mainPrice / comparePrice) * 100) : hasDesc ? product.priceConfig.descuento : 0;
                      return (
                        <>
                          {showStrike && <span className="text-xs text-gray-400 line-through">S/ {strikePrice}</span>}
                          <span className={`font-bold text-sm ${showStrike ? 'text-pink-600' : 'text-brand-600'}`}>S/ {finalPrice}</span>
                          {discountPercent > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">-{discountPercent}%</span>}
                        </>
                      );
                    })()}
                  </div>
                  {product.stock === 0 && (
                    <span className="text-[10px] text-red-500 font-bold mt-1 block">Agotado</span>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="text-[10px] text-orange-500 font-medium mt-1 block">Ultimas unidades</span>
                  )}
                  {product.priceConfig?.enabledTypes?.includes('mayorista') && product.priceConfig?.mayorista != null && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">Mayorista: S/ {product.priceConfig.mayorista}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No se encontraron productos</p>
            <Link href="/tienda" className="mt-4 inline-block text-brand-600 font-medium hover:text-brand-700 transition-colors">Ver todos</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function TiendaPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-400" size={32} /></div>}><TiendaContent /></Suspense>;
}
