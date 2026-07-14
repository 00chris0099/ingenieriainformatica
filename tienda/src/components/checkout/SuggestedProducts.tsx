'use client';

import { useState, useEffect } from 'react';
import { Package, Check } from 'lucide-react';

interface SuggestedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  imageUrl: string | null;
  type: 'existing' | 'custom';
  linkedProductId: string | null;
}

interface SuggestedProductsProps {
  productIds: string[];
  selectedProducts: SuggestedProduct[];
  onSelect: (product: SuggestedProduct) => void;
  onDeselect: (productId: string) => void;
}

export default function SuggestedProducts({ productIds, selectedProducts, onSelect, onDeselect }: SuggestedProductsProps) {
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedProducts = async () => {
      setLoading(true);
      const allSuggestions: SuggestedProduct[] = [];

      for (const productId of productIds) {
        try {
          const res = await fetch(`/api/v1/suggested-products?product_id=${productId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              allSuggestions.push(...data.data);
            }
          }
        } catch (err) {
          console.error('Failed to fetch suggested products:', err);
        }
      }

      setSuggestedProducts(allSuggestions);
      setLoading(false);
    };

    if (productIds.length > 0) {
      fetchSuggestedProducts();
    } else {
      setLoading(false);
    }
  }, [productIds]);

  const isSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const handleToggle = (product: SuggestedProduct) => {
    if (isSelected(product.id)) {
      onDeselect(product.id);
    } else {
      onSelect(product);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Package size={18} className="text-blue-600" />
          Productos sugeridos
        </h2>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <h2 className="font-semibold flex items-center gap-2 mb-3">
        <Package size={18} className="text-blue-600" />
        ¿Te interesa también?
      </h2>
      <p className="text-xs text-gray-500 mb-4">Selecciona productos adicionales para tu pedido</p>

      <div className="space-y-3">
        {suggestedProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => handleToggle(product)}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              isSelected(product.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Image */}
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package size={20} className="text-gray-400" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{product.name}</p>
              {product.description && (
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                  <span className="text-xs text-gray-400 line-through">S/ {product.compareAtPrice}</span>
                )}
                <span className="text-sm font-bold text-pink-600">S/ {product.price}</span>
                {product.discountPercent > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">
                    -{product.discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isSelected(product.id)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}>
              {isSelected(product.id) && <Check size={14} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
