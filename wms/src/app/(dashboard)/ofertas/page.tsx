'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Gift, Search, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  description: string | null;
  type: string;
  minQuantity: number;
  discountPercent: number;
  fixedPrice: number | null;
  productId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

const emptyOffer: Partial<Offer> = {
  name: '',
  description: '',
  type: 'discount',
  minQuantity: 1,
  discountPercent: 0,
  fixedPrice: null,
  productId: null,
  sortOrder: 0,
  isActive: true,
};

export default function OfertasPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/offers?limit=100');
      const data = await res.json();
      setOffers(data.data?.items || data.data || []);
    } catch (e) {
      console.error('Error fetching offers:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingOffer?.name) return;
    setSaving(true);
    try {
      const method = editingOffer.id ? 'PUT' : 'POST';
      const url = editingOffer.id ? `/api/v1/offers/${editingOffer.id}` : '/api/v1/offers';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffer),
      });
      setShowForm(false);
      setEditingOffer(null);
      fetchOffers();
    } catch (e) {
      console.error('Error saving offer:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta oferta?')) return;
    try {
      await fetch(`/api/v1/offers/${id}`, { method: 'DELETE' });
      fetchOffers();
    } catch (e) {
      console.error('Error deleting offer:', e);
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      await fetch(`/api/v1/offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      fetchOffers();
    } catch (e) {
      console.error('Error toggling offer:', e);
    }
  };

  const filtered = offers.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift size={24} className="text-pink-400" />
            Ofertas
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gestiona las ofertas que aparecen en el checkout</p>
        </div>
        <button
          onClick={() => { setEditingOffer({ ...emptyOffer }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Crear oferta
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ofertas..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Form Modal */}
      {showForm && editingOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {editingOffer.id ? 'Editar oferta' : 'Crear oferta'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingOffer.name || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Ej: Descuento por cantidad"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Descripcion</label>
                <textarea
                  value={editingOffer.description || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={2}
                  placeholder="Descripcion de la oferta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                  <select
                    value={editingOffer.type || 'discount'}
                    onChange={(e) => setEditingOffer({ ...editingOffer, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="discount">Descuento</option>
                    <option value="bundle">Bundle</option>
                    <option value="crosssell">Cross-sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cantidad minima</label>
                  <input
                    type="number"
                    value={editingOffer.minQuantity || 1}
                    onChange={(e) => setEditingOffer({ ...editingOffer, minQuantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    value={editingOffer.discountPercent || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, discountPercent: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio fijo (S/)</label>
                  <input
                    type="number"
                    value={editingOffer.fixedPrice ?? ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, fixedPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Orden</label>
                <input
                  type="number"
                  value={editingOffer.sortOrder || 0}
                  onChange={(e) => setEditingOffer({ ...editingOffer, sortOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowForm(false); setEditingOffer(null); }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editingOffer.name}
                className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingOffer.id ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Gift size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No hay ofertas {search ? 'que coincidan' : 'todavia'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((offer) => (
            <div key={offer.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Gift size={18} className="text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">{offer.name}</h3>
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">{offer.type}</span>
                  {!offer.isActive && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Inactiva</span>
                  )}
                </div>
                {offer.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{offer.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {offer.discountPercent > 0 && <span className="text-green-400">-{offer.discountPercent}%</span>}
                  {offer.fixedPrice != null && <span className="text-green-400">S/ {offer.fixedPrice} fijo</span>}
                  <span>Min: {offer.minQuantity} uds</span>
                  <span>Orden: {offer.sortOrder}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(offer)}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  title={offer.isActive ? 'Desactivar' : 'Activar'}
                >
                  {offer.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => { setEditingOffer({ ...offer }); setShowForm(true); }}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(offer.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
