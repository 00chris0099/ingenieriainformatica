'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useCartStore } from '@/store/cartStore';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
    compareAtPrice: number | null;
  };
}

export default function FavoritosPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/v1/wishlists');
      if (res.ok) {
        const data = await res.json();
        setWishlist(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setRemoving(productId);
    try {
      await fetch(`/api/v1/wishlists?productId=${productId}`, { method: 'DELETE' });
      setWishlist(wishlist.filter(item => item.productId !== productId));
    } catch (err) {
      console.error(err);
    }
    setRemoving(null);
  };

  const addToCart = (item: WishlistItem) => {
    addItem({
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : undefined,
      image: item.product.images?.[0] || '',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
          <Heart size={28} className="text-red-500" />
          Mis Favoritos
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">No tienes favoritos</h2>
            <p className="text-gray-500 mb-6">Guarda productos que te gusten para comprarlos despues</p>
            <Link href="/tienda" className="inline-block bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <Link href={`/producto/${item.product.slug}`}>
                  <img
                    src={item.product.images?.[0] || ''}
                    alt={item.product.name}
                    className="w-full aspect-square object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link href={`/producto/${item.product.slug}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-lg font-bold text-green-600 mt-2">S/ {Number(item.product.price).toFixed(2)}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => addToCart(item)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <ShoppingCart size={14} /> Agregar al carrito
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={removing === item.productId}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {removing === item.productId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
