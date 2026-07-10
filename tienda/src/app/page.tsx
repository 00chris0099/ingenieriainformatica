'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bed, Armchair, Baby, Palette, Bath, ToyBrick, Truck, Shield, RotateCcw, MessageCircle, Package } from 'lucide-react';

const categories = [
  { name: 'Camas y Cunas', slug: 'camas-cunas', Icon: Bed, description: 'Cunas, camas, berlines' },
  { name: 'Sillas Altas', slug: 'sillas-altas', Icon: Armchair, description: 'Para comer y jugar' },
  { name: 'Carritos', slug: 'carritos', Icon: Baby, description: 'Cochecitos y sillas de auto' },
  { name: 'Decoracion', slug: 'decoracion', Icon: Palette, description: 'Nursery y accesorios' },
  { name: 'Banos', slug: 'banos', Icon: Bath, description: 'Tinas e higiene' },
  { name: 'Juguetes', slug: 'juguetes', Icon: ToyBrick, description: 'Educativos y organization' },
];

const trustBadges = [
  { Icon: Truck, title: 'Envio gratis', desc: 'En pedidos +S/150' },
  { Icon: Shield, title: 'Garantia', desc: 'Hasta 12 meses' },
  { Icon: RotateCcw, title: 'Devoluciones', desc: 'En 30 dias' },
  { Icon: MessageCircle, title: 'Soporte 24/7', desc: 'WhatsApp' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/products?limit=4')
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setFeaturedProducts(data.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.variants?.[0]?.price || 0,
            image: p.images?.[0] || '',
            category: p.category?.name || '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 text-center relative">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              Muebles para bebes
              <span className="text-green-600"> con amor</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
              Todo lo que tu bebe necesita: camas, sillas, carritos y decoracion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tienda" className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg">
                Ver catalogo
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/tienda?categoria=${cat.slug}`}
                  className="group text-center p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-14 h-14 mx-auto bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-all">
                    <cat.Icon size={28} className="text-green-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Destacados</h2>
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square bg-gray-100">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                      <p className="text-green-600 font-bold mt-1">S/ {product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Cargando productos...</p>
              </div>
            )}
          </div>
        </section>

        {/* Why Us */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {trustBadges.map((badge) => (
                <div key={badge.title}>
                  <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-3">
                    <badge.Icon size={28} className="text-green-600" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold">{badge.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
