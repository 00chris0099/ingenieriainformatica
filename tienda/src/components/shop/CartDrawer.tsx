'use client';

import { ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Mi Carrito ({itemCount()})</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Tu carrito esta vacio</p>
              <Link href="/tienda" onClick={onClose} className="mt-3 inline-block text-brand-600 font-medium text-sm">Ir a la tienda</Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.size && `${item.size} `}{item.color}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-100"><Minus size={12} /></button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-100"><Plus size={12} /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-600">S/ {item.price * item.quantity}</span>
                      <button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">S/ {total()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Envio</span><span className="font-medium">{total() >= 150 ? 'Gratis' : 'S/ 10'}</span></div>
            <div className="border-t pt-2 flex justify-between"><span className="font-bold">Total</span><span className="font-bold text-brand-600">S/ {total() + (total() >= 150 ? 0 : 10)}</span></div>
            <Link href="/checkout" onClick={onClose}
              className="block w-full bg-brand-500 text-white py-3 rounded-xl font-semibold text-center hover:bg-brand-600 transition-colors">
              Proceder al checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
