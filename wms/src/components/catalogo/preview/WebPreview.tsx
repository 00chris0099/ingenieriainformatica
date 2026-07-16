'use client';

import { useProductForm } from '../ProductFormContext';
import ImageGallery from './ImageGallery';
import TrustBadges from './TrustBadges';
import RelatedProducts from './RelatedProducts';
import LandingBlockRenderer from './LandingBlockRenderer';
import CheckoutPreview from './CheckoutPreview';

export default function WebPreview() {
  const { name, brand, description, shortDescription, price, compareAtPrice, discountPercent, categoryId, productImages, landingBlocks, color, materials, recommendedAge, warrantyDays, originCountry, weight, weightUnit, dimensions, ctaText } = useProductForm();

  const displayImages = productImages;
  const hasDiscount = discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discountPercent / 100) * 100) / 100 : null;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-green-600">AdriSu Kids</span>
          <span className="text-xs text-gray-400">Ver tienda</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-50">
        Inicio &rsaquo; Tienda &rsaquo; <span className="text-gray-600">{name || 'Producto'}</span>
      </div>

      {/* Product Section */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* Image Gallery */}
        <div className="space-y-3">
          <ImageGallery images={displayImages} alt={name} />
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {brand && <p className="text-xs text-gray-500 uppercase tracking-wide">{brand}</p>}
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{name || 'Nombre del Producto'}</h1>

          {shortDescription && (
            <p className="text-sm text-gray-500 leading-relaxed">{shortDescription}</p>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              {(compareAtPrice && compareAtPrice > price) && (
                <span className="text-lg text-gray-400 line-through">S/ {compareAtPrice.toFixed(2)}</span>
              )}
              <span className="text-2xl font-bold text-green-600">
                S/ {price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                  -{discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <style>{`
            @keyframes cta-combined {
              0%, 100% { transform: scale(1); box-shadow: 0 0 5px rgba(34,197,94,0.3); }
              50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(34,197,94,0.6); }
            }
          `}</style>
          <button
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
            style={{ animation: 'cta-combined 2s ease-in-out infinite' }}
          >
            {ctaText || '¡Lo quiero ahora!'}
          </button>

          {/* Trust Badges */}
          <div className="pt-3 border-t border-gray-100">
            <TrustBadges />
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="px-6 pb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">Descripcion</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Specs */}
      {(color || materials.length > 0 || recommendedAge || warrantyDays || originCountry || weight || dimensions.height) && (
        <div className="px-6 pb-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2">Especificaciones</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {dimensions.height && <tr><td className="py-1.5 text-gray-500">Alto</td><td className="py-1.5">{dimensions.height} cm</td></tr>}
              {dimensions.width && <tr><td className="py-1.5 text-gray-500">Ancho</td><td className="py-1.5">{dimensions.width} cm</td></tr>}
              {dimensions.depth && <tr><td className="py-1.5 text-gray-500">Profundidad</td><td className="py-1.5">{dimensions.depth} cm</td></tr>}
              {weight && <tr><td className="py-1.5 text-gray-500">Peso</td><td className="py-1.5">{weight} {weightUnit}</td></tr>}
              {color && <tr><td className="py-1.5 text-gray-500">Color</td><td className="py-1.5">{color}</td></tr>}
              {materials.length > 0 && <tr><td className="py-1.5 text-gray-500">Materiales</td><td className="py-1.5">{materials.join(', ')}</td></tr>}
              {recommendedAge && <tr><td className="py-1.5 text-gray-500">Edad recomendada</td><td className="py-1.5">{recommendedAge}</td></tr>}
              {warrantyDays && <tr><td className="py-1.5 text-gray-500">Garantia</td><td className="py-1.5">{warrantyDays} dias</td></tr>}
              {originCountry && <tr><td className="py-1.5 text-gray-500">Origen</td><td className="py-1.5">{originCountry}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Landing Page Blocks */}
      {landingBlocks.length > 0 && (
        <div className="border-t border-gray-100">
          {landingBlocks.map((block) => (
            <LandingBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Checkout Preview */}
      <div className="border-t border-gray-100 p-4">
        <p className="text-[10px] text-gray-400 text-center mb-3 uppercase tracking-wider font-medium">Vista previa del checkout</p>
        <CheckoutPreview />
      </div>

      {/* Related Products */}
      <div className="px-6 pb-6">
        <RelatedProducts categoryId={categoryId} />
      </div>
    </div>
  );
}
