'use client';

import { useProductForm } from '../ProductFormContext';

interface PriceSectionProps {
  type: 'especial' | 'descuento' | 'mayorista';
}

const labels = {
  especial: 'Precio Especial',
  descuento: 'Descuento',
  mayorista: 'Precio Mayorista',
};

export default function PriceSection({ type }: PriceSectionProps) {
  const { prices, updatePrices } = useProductForm();

  if (type === 'descuento') {
    const discountedPrice = prices.main * (1 - (prices.descuento || 0) / 100);
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{labels[type]}</span>
          <span className="text-xs text-gray-500">Porcentaje</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="number"
                value={prices.descuento || ''}
                onChange={(e) => updatePrices({ descuento: parseFloat(e.target.value) || null })}
                min="0"
                max="100"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-gray-500 mb-1">Precio con descuento</p>
            <p className="text-lg font-bold text-green-400">
              S/ {discountedPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{labels[type]}</span>
        <span className="text-xs text-gray-500">S/</span>
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
        <input
          type="number"
          value={prices[type] || ''}
          onChange={(e) => updatePrices({ [type]: parseFloat(e.target.value) || null })}
          min="0"
          step="0.01"
          className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}
