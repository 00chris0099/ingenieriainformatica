'use client';

import { useState, useEffect } from 'react';

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'select' | 'color' | 'number';
  options?: string[];
  required?: boolean;
}

export function useCategoryAttributes(categoryId: string | null) {
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setAttributes([]);
      return;
    }

    const fetchAttributes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/categories/${categoryId}/attributes`);
        if (res.ok) {
          const data = await res.json();
          setAttributes(data.data?.attributes || []);
        }
      } catch (err) {
        console.error('Failed to fetch category attributes:', err);
      }
      setLoading(false);
    };

    fetchAttributes();
  }, [categoryId]);

  return { attributes, loading };
}
