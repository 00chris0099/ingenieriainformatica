'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionBlockPreviewProps {
  content: Record<string, any>;
}

export default function AccordionBlockPreview({ content }: AccordionBlockPreviewProps) {
  const items = content.items || [];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (items.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-center text-gray-400 text-sm">
        Agrega elementos para ver la preview
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: content.backgroundColor || '#ffffff' }}
    >
      {items.map((item: any, index: number) => (
        <div key={index} className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleExpand(index)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-900">
              {item.question || `Pregunta ${index + 1}`}
            </span>
            {expandedIndex === index ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>
          {expandedIndex === index && (
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {item.answer || 'Sin respuesta'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
