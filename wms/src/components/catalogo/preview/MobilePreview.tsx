'use client';

import { useProductForm } from '../ProductFormContext';
import ImageGallery from './ImageGallery';
import StickyCTA from './StickyCTA';
import LandingBlockRenderer from './LandingBlockRenderer';
import CheckoutPreview from './CheckoutPreview';
import { Heart, Home, Search, User, ShoppingBag } from 'lucide-react';

export default function MobilePreview() {
  const { name, brand, description, shortDescription, price, compareAtPrice, discountPercent, productImages, landingBlocks, ctaText } = useProductForm();

  const displayImages = productImages;
  const hasDiscount = discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discountPercent / 100) * 100) / 100 : null;

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
            <span className="text-sm font-semibold text-gray-900">AdriSu Kids</span>
            <button className="text-gray-900">
              <ShoppingBag size={18} />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="px-3 py-1.5 text-[9px] text-gray-400 border-b border-gray-50">
            Inicio &rsaquo; Tienda &rsaquo; <span className="text-gray-500">{name || 'Producto'}</span>
          </div>

          {/* Image Carousel */}
          <div className="relative">
            <ImageGallery images={displayImages} alt={name} />
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-2">
            {brand && <p className="text-[10px] text-gray-500 uppercase tracking-wide">{brand}</p>}
            <h2 className="text-sm font-extrabold text-gray-900 leading-tight">
              {name || 'Nombre del Producto'}
            </h2>

            {shortDescription && (
              <p className="text-[11px] text-gray-500 leading-relaxed">{shortDescription}</p>
            )}

            {/* Price */}
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2 flex-wrap">
                {(compareAtPrice && compareAtPrice > price) && (
                  <span className="text-xs text-gray-400 line-through">S/ {compareAtPrice.toFixed(2)}</span>
                )}
                <span className="text-lg font-bold text-green-600">
                  S/ {price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded">
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
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-bold text-xs"
              style={{ animation: 'cta-combined 2s ease-in-out infinite' }}
            >
              {ctaText || '¡Lo quiero ahora!'}
            </button>
          </div>

          {/* Description */}
          {description && (
            <div className="px-4 pb-3">
              <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{description}</p>
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
          <div className="border-t border-gray-100 p-3">
            <p className="text-[9px] text-gray-400 text-center mb-2 uppercase tracking-wider font-medium">Vista previa del checkout</p>
            <CheckoutPreview isMobile />
          </div>

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
