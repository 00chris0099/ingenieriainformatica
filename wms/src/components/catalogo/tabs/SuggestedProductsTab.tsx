'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, X, Loader2 } from 'lucide-react';

interface SuggestedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  type: 'existing' | 'custom';
}

interface SuggestedProductsTabProps {
  productId: string;
}

export default function SuggestedProductsTab({ productId }: SuggestedProductsTabProps) {
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetch(`/api/v1/suggested-products?product_id=${productId}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setSuggestedProducts(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const addCustomProduct = async () => {
    if (!newName.trim() || !newPrice) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/suggested-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          name: newName.trim(),
          description: newDescription.trim() || null,
          price: Number(newPrice),
          type: 'custom',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSuggestedProducts(prev => [...prev, data.data]);
        }
        setNewName('');
        setNewDescription('');
        setNewPrice('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add suggested product:', err);
    }
    setSaving(false);
  };

  const removeSuggested = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/suggested-products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuggestedProducts(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove suggested product:', err);
    }
  };

  if (!productId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Guarda el producto primero para agregar productos sugeridos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-300">Productos Sugeridos</h3>
          <p className="text-xs text-gray-500 mt-1">Aparecen en el checkout como opciones adicionales.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Agregar
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Nombre del producto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            type="text"
            placeholder="Descripcion (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S/</span>
            <input
              type="number"
              placeholder="Precio"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={addCustomProduct}
              disabled={!newName.trim() || !newPrice || saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : suggestedProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package size={24} className="mx-auto mb-2 text-gray-400" />
          <p className="text-xs">No hay productos sugeridos. Agrega uno arriba.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestedProducts.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl"
            >
              {sp.imageUrl ? (
                <img src={sp.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Package size={16} className="text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{sp.name}</p>
                {sp.description && (
                  <p className="text-xs text-gray-400 truncate">{sp.description}</p>
                )}
                <p className="text-xs font-bold text-green-400">S/ {sp.price}</p>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                {sp.type === 'custom' ? 'Custom' : 'Existente'}
              </span>
              <button
                onClick={() => removeSuggested(sp.id)}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
