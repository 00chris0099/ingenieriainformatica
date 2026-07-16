'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
          <h1 className="text-3xl font-extrabold mb-8">Mi Carrito</h1>
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">Tu carrito esta vacio</h2>
            <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
            <Link href="/tienda" className="inline-block bg-brand-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-brand-600 transition-colors">Ir a la tienda</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
        <h1 className="text-3xl font-extrabold mb-8">Mi Carrito ({itemCount()} items)</h1>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">SKU: {item.sku || '-'}</p>
                <p className="text-brand-600 font-bold mt-1">S/ {item.price}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex justify-between mb-2"><span className="text-gray-500">Subtotal</span><span className="font-medium">S/ {total()}</span></div>
          <div className="flex justify-between mb-2"><span className="text-gray-500">Envio</span><span className="font-medium">{total() >= 150 ? 'Gratis' : 'S/ 10'}</span></div>
          <div className="border-t pt-2 mt-2 flex justify-between"><span className="font-bold text-lg">Total</span><span className="font-bold text-lg text-brand-600">S/ {total() + (total() >= 150 ? 0 : 10)}</span></div>
          <Link href="/checkout" className="mt-4 block w-full bg-brand-500 text-white py-3 rounded-full font-semibold text-center hover:bg-brand-600 transition-colors">Proceder al checkout</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
