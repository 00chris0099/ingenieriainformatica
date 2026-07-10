'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

export default function ImageGallery({ images, alt = '' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  const mainImage = images[selectedIndex] || '';

  const handlePrev = () => {
    setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400 text-sm">Sin imagenes</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-square bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden cursor-zoom-in group"
        onClick={() => setIsZoomed(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <img
          src={mainImage}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300"
          style={isZoomed ? {
            transform: 'scale(2)',
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
          } : undefined}
        />

        {/* Zoom indicator */}
        {!isZoomed && (
          <div className="absolute top-3 right-3 p-2 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={16} className="text-white" />
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-xs">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-green-500 ring-2 ring-green-500/20'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
