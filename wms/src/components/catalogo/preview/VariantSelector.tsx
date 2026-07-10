'use client';

import { useState, useMemo } from 'react';
import { useProductForm, Variant } from '../ProductFormContext';

interface VariantSelectorProps {
  onVariantSelect?: (variant: Variant) => void;
}

export default function VariantSelector({ onVariantSelect }: VariantSelectorProps) {
  const { variants } = useProductForm();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Get unique attributes from all variants
  const attributes = useMemo(() => {
    const attrs: Record<string, Set<string>> = {};
    variants.forEach(v => {
      if (v.attributes) {
        Object.entries(v.attributes).forEach(([key, value]) => {
          if (value) {
            if (!attrs[key]) attrs[key] = new Set();
            attrs[key].add(String(value));
          }
        });
      }
    });
    return Object.entries(attrs).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [variants]);

  // Get active variant
  const selectedVariant = useMemo(() => {
    if (selectedVariantId) {
      return variants.find(v => v.id === selectedVariantId);
    }
    return variants.find(v => v.isActive) || variants[0];
  }, [selectedVariantId, variants]);

  const handleVariantClick = (variant: Variant) => {
    setSelectedVariantId(variant.id);
    onVariantSelect?.(variant);
  };

  if (variants.length <= 1) return null;

  return (
    <div className="space-y-4">
      {/* Attribute selectors */}
      {attributes.map(attr => (
        <div key={attr.name} className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {attr.name}: <span className="text-gray-500">{selectedVariant?.attributes?.[attr.name] || ''}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {attr.values.map(value => {
              const matchingVariant = variants.find(v => v.attributes?.[attr.name] === value);
              const isSelected = selectedVariant?.attributes?.[attr.name] === value;
              const isColor = attr.name.toLowerCase() === 'color';

              return (
                <button
                  key={value}
                  onClick={() => matchingVariant && handleVariantClick(matchingVariant)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isColor && (
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ backgroundColor: value }}
                    />
                  )}
                  <span className="text-sm">{value}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Variant quick select (if no attributes) */}
      {attributes.length === 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Variante</label>
          <div className="flex flex-wrap gap-2">
            {variants.filter(v => v.isActive).map(variant => (
              <button
                key={variant.id}
                onClick={() => handleVariantClick(variant)}
                className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                  selectedVariant?.id === variant.id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to get selected variant data
export function useSelectedVariant() {
  const { variants } = useProductForm();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (selectedVariantId) {
      return variants.find(v => v.id === selectedVariantId);
    }
    return variants.find(v => v.isActive) || variants[0];
  }, [selectedVariantId, variants]);

  const selectVariant = (id: string) => setSelectedVariantId(id);

  return { selectedVariant, selectVariant };
}
