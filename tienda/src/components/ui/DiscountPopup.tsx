'use client';

import { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';

interface DiscountPopupConfig {
  enabled: boolean;
  title: string;
  description: string;
  discountPercent: number;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
}

interface DiscountPopupProps {
  config: DiscountPopupConfig;
  productPrice: number;
  productName: string;
  productImage?: string;
  onClose: () => void;
}

export default function DiscountPopup({
  config,
  productPrice,
  productName,
  productImage,
  onClose,
}: DiscountPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen this popup
    const storageKey = `discount-popup-seen-${productName}`;
    const hasSeen = sessionStorage.getItem(storageKey);

    if (!hasSeen && config.enabled) {
      setIsVisible(true);
    }
  }, [config.enabled, productName]);

  const handleClose = () => {
    const storageKey = `discount-popup-seen-${productName}`;
    sessionStorage.setItem(storageKey, 'true');
    setIsVisible(false);
    onClose();
  };

  const handleCTA = () => {
    handleClose();
    if (config.ctaUrl && config.ctaUrl !== '#') {
      window.location.href = config.ctaUrl;
    }
  };

  if (!isVisible || !config.enabled) return null;

  const discountedPrice = productPrice * (1 - config.discountPercent / 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Popup */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95"
        style={{ backgroundColor: config.bgColor, color: config.textColor }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/30 transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Discount Badge */}
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-bold">-{config.discountPercent}% OFF</span>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Product Image */}
          {(productImage || config.imageUrl) && (
            <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden bg-white/20">
              <img
                src={productImage || config.imageUrl}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold mb-2">{config.title}</h2>

          {/* Description */}
          <p className="text-sm opacity-90 mb-4">{config.description}</p>

          {/* Price */}
          <div className="mb-4">
            <p className="text-sm line-through opacity-60">S/ {productPrice.toFixed(2)}</p>
            <p className="text-3xl font-bold">S/ {discountedPrice.toFixed(2)}</p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCTA}
            className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105"
            style={{ backgroundColor: config.textColor, color: config.bgColor }}
          >
            <ShoppingCart size={18} />
            {config.ctaText}
          </button>

          {/* Close text */}
          <button
            onClick={handleClose}
            className="mt-3 text-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            No gracias, seguir comprando
          </button>
        </div>
      </div>
    </div>
  );
}
