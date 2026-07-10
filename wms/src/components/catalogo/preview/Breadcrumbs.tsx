'use client';

import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  category?: string;
  productName?: string;
}

export default function Breadcrumbs({ category, productName }: BreadcrumbsProps) {
  if (!category && !productName) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 overflow-hidden">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <Home size={14} className="text-gray-400" />
        <a href="#" className="hover:text-green-600 transition-colors">Inicio</a>
      </span>
      {category && (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-900 font-medium truncate max-w-[150px]">{category}</span>
        </span>
      )}
      {productName && (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-900 font-medium truncate max-w-[150px]">{productName}</span>
        </span>
      )}
    </nav>
  );
}
