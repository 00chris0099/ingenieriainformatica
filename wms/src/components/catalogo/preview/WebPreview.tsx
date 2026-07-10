'use client';

import { useProductForm } from '../ProductFormContext';
import ImageGallery from './ImageGallery';
import VariantSelector from './VariantSelector';
import ProductTabs from './ProductTabs';
import ShareButtons from './ShareButtons';
import TrustBadges from './TrustBadges';
import RelatedProducts from './RelatedProducts';
import LandingBlockRenderer from './LandingBlockRenderer';
import { ShoppingCart, Heart } from 'lucide-react';

export default function WebPreview() {
  const { name, brand, description, prices, enabledPriceTypes, variants, categoryId, productImages, activeTab, landingBlocks } = useProductForm();

  const displayImages = productImages.length > 0 ? productImages : (variants[0]?.images || []);
  const hasDiscount = enabledPriceTypes.includes('descuento') && prices.descuento;
  const discountedPrice = hasDiscount ? prices.main * (1 - prices.descuento / 100) : null;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-green-600">{brand || 'Tienda'}</span>
          <span className="text-xs text-gray-500">Ver tienda</span>
        </div>
      </div>

      {/* Product Section */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* Image Gallery */}
        <div className="space-y-3">
          <ImageGallery images={displayImages} alt={name} />
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {brand && <p className="text-sm text-gray-500 uppercase tracking-wide">{brand}</p>}
          <h1 className="text-xl font-bold text-gray-900">{name || 'Nombre del Producto'}</h1>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              {hasDiscount && discountedPrice && (
                <span className="text-lg text-gray-400 line-through">S/ {prices.main.toFixed(2)}</span>
              )}
              <span className="text-2xl font-bold text-green-600">
                S/ {(hasDiscount && discountedPrice ? discountedPrice : prices.main).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  -{prices.descuento}%
                </span>
              )}
            </div>
            {enabledPriceTypes.includes('especial') && prices.especial && (
              <p className="text-sm text-gray-500">Precio especial: S/ {prices.especial.toFixed(2)}</p>
            )}
            {enabledPriceTypes.includes('mayorista') && prices.mayorista && (
              <p className="text-sm text-gray-500">Precio mayorista: S/ {prices.mayorista.toFixed(2)}</p>
            )}
          </div>

          {/* Variant Selector */}
          <VariantSelector />

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
              <ShoppingCart size={18} />
              Agregar al carrito
            </button>
            <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Heart size={18} className="text-gray-400" />
            </button>
          </div>

          {/* Share Buttons */}
          <ShareButtons />

          {/* Trust Badges */}
          <div className="pt-4 border-t">
            <TrustBadges />
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <div className="px-6 pb-6">
        <ProductTabs />
      </div>

      {/* Related Products */}
      <div className="px-6 pb-6">
        <RelatedProducts categoryId={categoryId} />
      </div>

      {/* Landing Page Blocks */}
      {activeTab === 'landing' && landingBlocks.length > 0 && (
        <div className="border-t border-gray-100">
          {landingBlocks.map((block) => (
            <LandingBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}
