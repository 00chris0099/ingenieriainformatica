'use client';

import { useProductForm } from '../ProductFormContext';
import { Gift, Eye } from 'lucide-react';

export default function PricingTab() {
  const { price, compareAtPrice, discountPercent, costPrice, stock, discountPopup, updateField, toggleDiscountPopup, updateDiscountPopup } = useProductForm();

  const effectivePrice = discountPercent > 0
    ? Math.round(price * (1 - discountPercent / 100) * 100) / 100
    : price;

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Precio (S/) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
          <input
            type="number"
            value={price || ''}
            onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full pl-8 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Compare at Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Comparar con precio (S/)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
          <input
            type="number"
            value={compareAtPrice ?? ''}
            onChange={(e) => updateField('compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            step="0.01"
            className="w-full pl-8 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-gray-500">Precio tachado mostrado al cliente (opcional)</p>
      </div>

      {/* Discount Percent */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Descuento (%)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
          <input
            type="number"
            value={discountPercent || ''}
            onChange={(e) => updateField('discountPercent', parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="1"
            className="w-full pl-8 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="0"
          />
        </div>
        {discountPercent > 0 && (
          <p className="text-sm text-green-400">
            Precio final: S/ {effectivePrice.toFixed(2)}
          </p>
        )}
      </div>

      {/* Cost Price */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Costo (S/)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
          <input
            type="number"
            value={costPrice ?? ''}
            onChange={(e) => updateField('costPrice', e.target.value ? parseFloat(e.target.value) : null)}
            min="0"
            step="0.01"
            className="w-full pl-8 pr-3 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="0.00"
          />
        </div>
        {costPrice != null && costPrice > 0 && price > 0 && (
          <p className="text-xs text-gray-500">
            Margen: {((price - costPrice) / price * 100).toFixed(1)}%
          </p>
        )}
      </div>

      {/* Discount Popup Configuration */}
      <div className="border-t border-gray-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-pink-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Popup de Descuento</h3>
              <p className="text-xs text-gray-500">Aparece cuando el usuario cierra el checkout</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDiscountPopup}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              discountPopup.enabled ? 'bg-pink-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                discountPopup.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {discountPopup.enabled && (
          <div className="space-y-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            {/* Preview */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">Vista previa del popup</span>
              </div>
              <div
                className="rounded-lg p-4 text-center"
                style={{ backgroundColor: discountPopup.bgColor, color: discountPopup.textColor }}
              >
                <p className="font-bold text-lg">{discountPopup.title}</p>
                <p className="text-sm opacity-90 mt-1">{discountPopup.description}</p>
                {(discountPopup.discountAmount != null && discountPopup.discountAmount > 0) ? (
                  <p className="text-2xl font-bold mt-2">S/ {discountPopup.discountAmount} OFF</p>
                ) : discountPopup.discountPercent > 0 ? (
                  <p className="text-2xl font-bold mt-2">-{discountPopup.discountPercent}% OFF</p>
                ) : null}
                <button
                  type="button"
                  className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium"
                >
                  {discountPopup.ctaText}
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Titulo del popup</label>
                <input
                  type="text"
                  value={discountPopup.title}
                  onChange={(e) => updateDiscountPopup({ title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Oferta especial!"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
                <input
                  type="text"
                  value={discountPopup.description}
                  onChange={(e) => updateDiscountPopup({ description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Obtén un descuento exclusivo"
                />
              </div>

              {/* Discount Type Toggle */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-2">Tipo de descuento</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateDiscountPopup({ discountPercent: discountPopup.discountPercent || 10, discountAmount: null })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      (discountPopup.discountAmount == null) ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDiscountPopup({ discountAmount: discountPopup.discountAmount || 5, discountPercent: 0 })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      (discountPopup.discountAmount != null) ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    Monto fijo (S/)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              {(discountPopup.discountAmount == null) ? (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    value={discountPopup.discountPercent}
                    onChange={(e) => updateDiscountPopup({ discountPercent: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Descuento fijo (S/)</label>
                  <input
                    type="number"
                    value={discountPopup.discountAmount || ''}
                    onChange={(e) => updateDiscountPopup({ discountAmount: parseFloat(e.target.value) || null })}
                    min="0"
                    step="0.50"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Ej: 5.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1">Texto del boton CTA</label>
                <input
                  type="text"
                  value={discountPopup.ctaText}
                  onChange={(e) => updateDiscountPopup({ ctaText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Comprar ahora"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">URL del boton</label>
                <input
                  type="text"
                  value={discountPopup.ctaUrl}
                  onChange={(e) => updateDiscountPopup({ ctaUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="#"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Color de fondo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={discountPopup.bgColor}
                    onChange={(e) => updateDiscountPopup({ bgColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={discountPopup.bgColor}
                    onChange={(e) => updateDiscountPopup({ bgColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Color de texto</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={discountPopup.textColor}
                    onChange={(e) => updateDiscountPopup({ textColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={discountPopup.textColor}
                    onChange={(e) => updateDiscountPopup({ textColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
