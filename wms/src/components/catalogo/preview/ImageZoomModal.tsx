'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageZoomModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export default function ImageZoomModal({ images, initialIndex = 0, isOpen, onClose, alt = '' }: ImageZoomModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    setSelectedIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
      if (e.key === 'ArrowRight') setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const handlePrev = () => {
    setSelectedIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    setZoomLevel(1);
  };

  const handleNext = () => {
    setSelectedIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    setZoomLevel(1);
  };

  const toggleZoom = () => {
    setZoomLevel(prev => prev === 1 ? 2 : 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <div className="relative max-w-4xl max-h-[80vh] w-full mx-4">
        <img
          src={images[selectedIndex]}
          alt={alt}
          className="w-full h-full object-contain transition-transform duration-300 cursor-zoom-in"
          style={{ transform: `scale(${zoomLevel})` }}
          onClick={toggleZoom}
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleZoom}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            {zoomLevel > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 py-4 bg-gradient-to-t from-black/80 to-transparent">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => { setSelectedIndex(index); setZoomLevel(1); }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-white'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
