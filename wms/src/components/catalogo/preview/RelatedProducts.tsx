'use client';

import { useState, useEffect } from 'react';

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface RelatedProductsProps {
  categoryId?: string;
}

export default function RelatedProducts({ categoryId }: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);

  useEffect(() => {
    if (!categoryId) return;

    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/v1/products?category=&limit=4`);
        if (res.ok) {
          const data = await res.json();
          const items = (data.data || []).slice(0, 4).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.variants?.[0]?.price || 0,
            image: p.images?.[0] || '',
          }));
          setProducts(items);
        }
      } catch (err) {
        // Silently fail
      }
    };

    fetchRelated();
  }, [categoryId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambien te puede interesar</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
            <p className="text-sm font-bold text-green-600">S/ {product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
