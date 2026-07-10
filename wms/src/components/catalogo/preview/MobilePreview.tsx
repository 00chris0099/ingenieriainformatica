'use client';

import { useProductForm } from '../ProductFormContext';
import ImageGallery from './ImageGallery';
import VariantSelector from './VariantSelector';
import ProductTabs from './ProductTabs';
import StickyCTA from './StickyCTA';
import LandingBlockRenderer from './LandingBlockRenderer';
import { Heart, Home, Search, User, ShoppingBag } from 'lucide-react';

export default function MobilePreview() {
  const { name, brand, prices, enabledPriceTypes, variants, productImages, activeTab, landingBlocks } = useProductForm();

  const displayImages = productImages.length > 0 ? productImages : (variants[0]?.images || []);
  const hasDiscount = enabledPriceTypes.includes('descuento') && prices.descuento;
  const discountedPrice = hasDiscount ? prices.main * (1 - prices.descuento / 100) : null;

  return (
    <div className="max-w-[280px] mx-auto">
      <div className="bg-black rounded-[32px] p-2 shadow-2xl">
        <div className="bg-white rounded-[24px] overflow-hidden">
          {/* Status Bar */}
          <div className="bg-white px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-black rounded-sm" />
              <div className="w-3 h-2 bg-black rounded-sm" />
              <div className="w-4 h-2 bg-black rounded-sm" />
            </div>
          </div>

          {/* Nav Bar */}
          <div className="bg-white px-4 py-2 flex items-center justify-between border-b">
            <button className="text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900">{brand || 'Tienda'}</span>
            <button className="text-gray-900">
              <ShoppingBag size={18} />
            </button>
          </div>

          {/* Image Carousel */}
          <div className="relative">
            <ImageGallery images={displayImages} alt={name} />
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-3">
            {brand && <p className="text-[10px] text-gray-500 uppercase tracking-wide">{brand}</p>}
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              {name || 'Nombre del Producto'}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              {hasDiscount && discountedPrice && (
                <span className="text-xs text-gray-400 line-through">S/ {prices.main.toFixed(2)}</span>
              )}
              <span className="text-lg font-bold text-green-600">
                S/ {(hasDiscount && discountedPrice ? discountedPrice : prices.main).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-medium rounded">
                  -{prices.descuento}%
                </span>
              )}
            </div>

            {/* Variant Selector */}
            <VariantSelector />
          </div>

          {/* Product Tabs */}
          <div className="px-4 pb-4">
            <ProductTabs />
          </div>

          {/* Landing Page Blocks */}
          {activeTab === 'landing' && landingBlocks.length > 0 && (
            <div className="border-t border-gray-100">
              {landingBlocks.map((block) => (
                <LandingBlockRenderer key={block.id} block={block} />
              ))}
            </div>
          )}

          {/* Bottom Nav */}
          <div className="bg-white border-t px-4 py-2 flex items-center justify-around">
            <button className="flex flex-col items-center gap-0.5">
              <Home size={16} className="text-gray-400" />
              <span className="text-[8px] text-gray-400">Inicio</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <Search size={16} className="text-gray-400" />
              <span className="text-[8px] text-gray-400">Buscar</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <Heart size={16} className="text-gray-400" />
              <span className="text-[8px] text-gray-400">Favoritos</span>
            </button>
            <button className="flex flex-col items-center gap-0.5">
              <User size={16} className="text-gray-400" />
              <span className="text-[8px] text-gray-400">Cuenta</span>
            </button>
          </div>

          {/* Sticky CTA */}
          <StickyCTA />
        </div>
      </div>
    </div>
  );
}
