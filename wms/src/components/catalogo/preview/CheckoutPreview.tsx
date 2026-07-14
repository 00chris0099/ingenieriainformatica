'use client';

import { useState } from 'react';
import { useProductForm } from '../ProductFormContext';
import { X, Check, Truck, Loader2 } from 'lucide-react';

const UBIGEO: Record<string, Record<string, string[]>> = {
  'Lima': { 'Lima': ['Miraflores', 'San Isidro', 'Jesus Maria', 'San Borja', 'Surco'] },
  'Arequipa': { 'Arequipa': ['Cercado', 'Cayma', 'Cerro Colorado'] },
  'Cusco': { 'Cusco': ['Cercado', 'Wanchaq'] },
};

interface CheckoutPreviewProps {
  isMobile?: boolean;
}

export default function CheckoutPreview({ isMobile = false }: CheckoutPreviewProps) {
  const { name, prices, enabledPriceTypes, variants, productImages, ctaText } = useProductForm();
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const activeVariants = variants.filter(v => v.isActive);
  const offer = selectedOffer || activeVariants[0] || { name: '1 Unidad', price: prices.main, compareAtPrice: null, images: [] };
  const mainImage = productImages[0] || offer.images?.[0] || '';

  const hasDiscount = enabledPriceTypes.includes('descuento') && prices.descuento && prices.descuento > 0;
  const mainPrice = prices.main || 0;
  const finalPrice = hasDiscount ? Math.round(mainPrice * (1 - prices.descuento / 100) * 100) / 100 : mainPrice;

  const offerDiscount = offer.compareAtPrice && offer.compareAtPrice > offer.price
    ? Math.round((1 - offer.price / offer.compareAtPrice) * 100)
    : 0;

  const subtotal = offer.price || finalPrice;
  const shipping = subtotal >= 150 ? 0 : 10;
  const total = subtotal + shipping;

  const containerClass = isMobile
    ? 'max-w-[280px] mx-auto'
    : 'bg-white rounded-lg overflow-hidden shadow-xl max-w-md mx-auto border border-gray-200';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-green-600">AdriSu Kids</span>
        <span className="text-[10px] text-gray-400">Checkout Preview</span>
      </div>

      {/* Product Summary */}
      <div className="p-3 bg-gray-50 flex gap-3">
        {mainImage ? (
          <img src={mainImage} alt="" className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">{name || 'Producto'}</p>
          <p className="text-[10px] text-green-600 font-medium">{offer.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {offerDiscount > 0 && (
              <span className="text-[10px] text-gray-400 line-through">S/ {offer.compareAtPrice}</span>
            )}
            <span className="text-sm font-bold text-green-600">S/ {(offer.price || finalPrice).toFixed(2)}</span>
            {offerDiscount > 0 && (
              <span className="text-[8px] px-1 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">-{offerDiscount}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Offer Selection */}
      {activeVariants.length > 1 && (
        <div className="p-3 border-t border-gray-100">
          <p className="text-[10px] font-medium text-gray-500 mb-1.5">Selecciona tu oferta:</p>
          <div className="space-y-1.5">
            {activeVariants.map((v) => {
              const isSelected = (selectedOffer?.id || activeVariants[0]?.id) === v.id;
              const vDiscount = v.compareAtPrice && v.compareAtPrice > v.price
                ? Math.round((1 - v.price / v.compareAtPrice) * 100) : 0;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedOffer(v)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  {v.images?.[0] && <img src={v.images[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-semibold text-gray-900 truncate">{v.name}</p>
                      {(v.attributes as any)?.badge && (
                        <span className="text-[7px] px-1 py-0.5 bg-orange-500 text-white rounded">{(v.attributes as any).badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {vDiscount > 0 && <span className="text-[9px] text-gray-400 line-through">S/ {v.compareAtPrice}</span>}
                      <span className="text-[10px] font-bold text-green-600">S/ {v.price}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="p-3 border-t border-gray-100">
        <style>{`
          @keyframes cta-preview { 0%,100%{transform:scale(1);box-shadow:0 0 5px rgba(34,197,94,0.3)} 50%{transform:scale(1.02);box-shadow:0 0 15px rgba(34,197,94,0.5)} }
        `}</style>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700"
          style={{ animation: 'cta-preview 2s ease-in-out infinite' }}
        >
          {ctaText || '¡Lo quiero ahora!'}
        </button>
      </div>

      {/* Shipping Form (expanded) */}
      {showForm && (
        <div className="p-3 border-t border-gray-100 space-y-2">
          <p className="text-[10px] font-medium text-gray-500">Datos de envio</p>
          <input type="text" placeholder="Nombre completo" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input type="tel" placeholder="Celular (9 digitos)" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-green-500" />
          <div className="grid grid-cols-3 gap-1.5">
            <select className="px-1.5 py-2 border border-gray-200 rounded-lg text-[9px] focus:outline-none">
              <option>Depto.</option>
              {Object.keys(UBIGEO).map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="px-1.5 py-2 border border-gray-200 rounded-lg text-[9px] focus:outline-none">
              <option>Prov.</option>
            </select>
            <select className="px-1.5 py-2 border border-gray-200 rounded-lg text-[9px] focus:outline-none">
              <option>Dist.</option>
            </select>
          </div>
          <input type="text" placeholder="Direccion" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-green-500" />
          <input type="text" placeholder="Referencia (opcional)" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-green-500" />

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-1 mt-2">
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{offer.name}</span>
              <span>S/ {(offer.price || finalPrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span className="flex items-center gap-1"><Truck size={10} /> Envio</span>
              <span>{shipping === 0 ? <span className="text-green-600">Gratis</span> : `S/ ${shipping.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-gray-200 pt-1 flex justify-between text-xs font-bold text-gray-900">
              <span>Total</span>
              <span className="text-green-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex gap-1.5">
            <button className="flex-1 py-1.5 rounded-lg text-[9px] font-medium border border-green-500 bg-green-50 text-green-700">Contraentrega</button>
            <button className="flex-1 py-1.5 rounded-lg text-[9px] font-medium border border-gray-200 text-gray-500">MercadoPago</button>
          </div>

          <button className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-[10px]">COMPRAR AHORA</button>
        </div>
      )}
    </div>
  );
}
