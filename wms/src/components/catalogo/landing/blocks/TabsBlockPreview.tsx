'use client';

import { useState } from 'react';

interface TabsBlockPreviewProps {
  content: Record<string, any>;
}

export default function TabsBlockPreview({ content }: TabsBlockPreviewProps) {
  const items = content.items || [];
  const [activeTab, setActiveTab] = useState(0);

  if (items.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-center text-gray-400 text-sm">
        Agrega tabs para ver la preview
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {items.map((item: any, index: number) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === index
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.title || `Tab ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {items[activeTab]?.content || 'Sin contenido'}
        </p>
      </div>
    </div>
  );
}
