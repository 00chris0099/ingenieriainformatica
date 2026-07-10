'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Heart } from 'lucide-react';
import { useProductForm } from '../ProductFormContext';

export default function StickyCTA() {
  const { name, prices, enabledPriceTypes, variants } = useProductForm();
  const [quantity, setQuantity] = useState(1);

  const hasDiscount = enabledPriceTypes.includes('descuento') && prices.descuento;
  const discountedPrice = hasDiscount ? prices.main * (1 - prices.descuento / 100) : null;
  const displayPrice = hasDiscount && discountedPrice ? discountedPrice : prices.main;
  const total = displayPrice * quantity;

  return (
    <div className="bg-white border-t border-gray-200 p-3 safe-bottom">
      {/* Price and Quantity */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-gray-500">Total</p>
          <p className="text-lg font-bold text-green-600">S/ {total.toFixed(2)}</p>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
          >
            <Minus size={12} />
          </button>
          <span className="text-sm font-medium w-6 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 py-2.5 bg-green-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors">
          <ShoppingCart size={14} />
          Agregar al carrito
        </button>
        <button className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Heart size={14} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
