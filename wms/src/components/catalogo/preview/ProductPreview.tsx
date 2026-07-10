'use client';

import { useProductForm } from '../ProductFormContext';
import WebPreview from './WebPreview';
import MobilePreview from './MobilePreview';
import { Monitor, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';

export default function ProductPreview() {
  const { previewMode, setPreviewMode, togglePreview } = useProductForm();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-800 overflow-hidden transition-all duration-300 ${
      expanded ? 'fixed inset-4 z-50' : 'h-full rounded-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode('web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              previewMode === 'web'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Monitor size={12} />
            Web
          </button>
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              previewMode === 'mobile'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Smartphone size={12} />
            Mobile
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            title={expanded ? 'Contraer' : 'Expandir'}
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={togglePreview}
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"
            title="Ocultar preview"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto p-4">
        {previewMode === 'web' ? <WebPreview /> : <MobilePreview />}
      </div>
    </div>
  );
}
