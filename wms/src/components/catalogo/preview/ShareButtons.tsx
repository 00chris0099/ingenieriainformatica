'use client';

import { Share2, MessageCircle, Copy } from 'lucide-react';
import { useProductForm } from '../ProductFormContext';
import { useState } from 'react';

export default function ShareButtons() {
  const { name, prices } = useProductForm();
  const [copied, setCopied] = useState(false);

  const productUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Mira este producto: ${name} - S/ ${prices.main}`;

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + productUrl)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Compartir:</span>
      <button
        onClick={handleWhatsApp}
        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
        title="WhatsApp"
      >
        <MessageCircle size={14} />
      </button>
      <button
        onClick={handleFacebook}
        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
        title="Facebook"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
      <button
        onClick={handleCopyLink}
        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
        title="Copiar enlace"
      >
        {copied ? <span className="text-[10px] text-green-600">OK</span> : <Copy size={14} />}
      </button>
    </div>
  );
}
