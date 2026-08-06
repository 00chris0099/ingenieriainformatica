'use client';

import { useState, useEffect } from 'react';
import { useProductForm } from '../ProductFormContext';
import { Gift, Plus, Trash2, Edit, Package, Loader2, Image, Tag, Layers, X } from 'lucide-react';

interface Offer {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  type: string;
  quantity: number;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number | null;
  linkedProductId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export default function OffersTab() {
  const form = useProductForm();
  const productId = form.productId;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    fetch(`/api/v1/offers?product_id=${productId}`)
      .then(r => r.json())
      .then(data => {
        const items = (data.data?.items || data.data || []).map((o: any) => ({
          ...o,
          price: Number(o.price),
          compareAtPrice: o.compareAtPrice != null ? Number(o.compareAtPrice) : null,
          discountPercent: o.discountPercent != null ? Number(o.discountPercent) : null,
        }));
        setOffers(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    fetch('/api/v1/products?limit=200&status=active')
      .then(r => r.json())
      .then(data => {
        const items = data.data?.items || data.data || [];
        setProducts(items.map((p: any) => ({ id: p.id, name: p.name, price: Number(p.price) })));
      })
      .catch(() => {});
  }, []);

  const startAdd = (type: 'quantity' | 'addon') => {
    setEditingOffer({
      productId: productId || '',
      name: '',
      type,
      quantity: type === 'quantity' ? 1 : 1,
      price: 0,
      compareAtPrice: null,
      discountPercent: null,
      linkedProductId: null,
      imageUrl: null,
      sortOrder: offers.length,
      isActive: true,
    });
    setShowForm(true);
  };

  const startEdit = (offer: Offer) => {
    setEditingOffer({ ...offer });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingOffer?.name || !editingOffer.productId) return;
    if (!editingOffer.compareAtPrice || editingOffer.compareAtPrice <= 0) return;
    setSaving(true);
    try {
      const payload = {
        productId: editingOffer.productId,
        name: editingOffer.name,
        description: editingOffer.description || null,
        type: editingOffer.type,
        quantity: editingOffer.quantity || 1,
        compareAtPrice: editingOffer.compareAtPrice,
        discountPercent: editingOffer.discountPercent || 0,
        price: editingOffer.price ?? editingOffer.compareAtPrice,
        linkedProductId: editingOffer.linkedProductId || null,
        imageUrl: editingOffer.imageUrl || null,
        sortOrder: editingOffer.sortOrder ?? 0,
        isActive: editingOffer.isActive ?? true,
      };
      const method = editingOffer.id ? 'PUT' : 'POST';
      const url = editingOffer.id ? `/api/v1/offers/${editingOffer.id}` : '/api/v1/offers';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (editingOffer.id) {
          setOffers(prev => prev.map(o => o.id === editingOffer.id ? data.data : o));
        } else {
          setOffers(prev => [...prev, data.data]);
        }
        setShowForm(false);
        setEditingOffer(null);
      }
    } catch (e) {
      console.error('Error saving offer:', e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/offers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOffers(prev => prev.filter(o => o.id !== id));
      }
    } catch (e) {
      console.error('Error deleting offer:', e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingOffer) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'offers');
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setEditingOffer(prev => prev ? { ...prev, imageUrl: data.url } : prev);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
    setImageUploading(false);
  };

  const moveOffer = async (id: string, direction: 'up' | 'down') => {
    const idx = offers.findIndex(o => o.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= offers.length) return;

    const newOffers = [...offers];
    const itemA = newOffers[idx];
    const itemB = newOffers[swapIdx];
    if (!itemA || !itemB) return;
    newOffers[idx] = itemB;
    newOffers[swapIdx] = itemA;
    const reordered = newOffers.map((o, i) => ({ ...o, sortOrder: i }));
    setOffers(reordered);

    try {
      await Promise.all(reordered.map(o =>
        fetch(`/api/v1/offers/${o.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: o.sortOrder }),
        })
      ));
    } catch (e) {
      console.error('Error reordering:', e);
    }
  };

  if (!productId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Gift size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Guarda el producto primero para agregar ofertas.</p>
      </div>
    );
  }

  const finalPrice = form.price * (1 - form.discountPercent / 100);

  const quantityOffers = offers.filter(o => o.type === 'quantity').sort((a, b) => a.sortOrder - b.sortOrder);
  const addonOffers = offers.filter(o => o.type === 'addon').sort((a, b) => a.sortOrder - b.sortOrder);

  const renderOfferPrice = (offer: Offer) => {
    const hasCompare = offer.compareAtPrice != null && offer.compareAtPrice > offer.price;
    const discountPct = offer.discountPercent != null && offer.discountPercent > 0
      ? offer.discountPercent
      : (hasCompare ? Math.round((1 - offer.price / offer.compareAtPrice!) * 100) : 0);
    return (
      <div className="flex items-center gap-2">
        {hasCompare && (
          <span className="text-xs text-gray-500 line-through">S/ {offer.compareAtPrice!.toFixed(2)}</span>
        )}
        <span className={`text-xs font-bold ${hasCompare ? 'text-red-400' : 'text-green-400'}`}>
          S/ {offer.price.toFixed(2)}
        </span>
        {discountPct > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">
            -{discountPct}%
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Product Card (read-only) */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Producto Principal</h3>
        <div className="flex items-center gap-4">
          {form.productImages[form.mainImageIndex] ? (
            <img src={form.productImages[form.mainImageIndex]} alt="" className="w-14 h-14 rounded-lg object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center">
              <Package size={20} className="text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{form.name || 'Sin nombre'}</p>
            <div className="flex items-center gap-2 mt-1">
              {form.discountPercent > 0 && (
                <span className="text-xs text-gray-500 line-through">S/ {form.price.toFixed(2)}</span>
              )}
              <span className="text-sm font-bold text-green-400">S/ {finalPrice.toFixed(2)}</span>
              {form.discountPercent > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                  -{form.discountPercent}%
                </span>
              )}
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded-lg">
            SKU: {form.sku || 'N/A'}
          </span>
        </div>
      </div>

      {/* Quantity Offers Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h3 className="text-sm font-medium text-gray-300">Ofertas por Cantidad</h3>
            <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{quantityOffers.length}</span>
          </div>
          <button
            onClick={() => startAdd('quantity')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : quantityOffers.length === 0 ? (
          <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <Layers size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-xs text-gray-500">No hay ofertas por cantidad.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quantityOffers.map((offer) => (
              <div key={offer.id} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Tag size={14} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{offer.name}</p>
                    {!offer.isActive && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">Inactiva</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {offer.quantity} unidades
                  </p>
                  {renderOfferPrice(offer)}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => moveOffer(offer.id, 'up')}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-xs"
                    title="Mover arriba"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => moveOffer(offer.id, 'down')}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-xs"
                    title="Mover abajo"
                  >
                    &#9660;
                  </button>
                  <button
                    onClick={() => startEdit(offer)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Addon Offers Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-pink-400" />
            <h3 className="text-sm font-medium text-gray-300">Add-ons / Productos Adicionales</h3>
            <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">{addonOffers.length}</span>
          </div>
          <button
            onClick={() => startAdd('addon')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {addonOffers.length === 0 && !loading ? (
          <div className="text-center py-8 bg-gray-800/50 rounded-xl border border-dashed border-gray-700">
            <Gift size={24} className="mx-auto mb-2 text-gray-600" />
            <p className="text-xs text-gray-500">No hay productos adicionales.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {addonOffers.map((offer) => {
              const linked = products.find(p => p.id === offer.linkedProductId);
              return (
                <div key={offer.id} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <Gift size={14} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{offer.name}</p>
                      {!offer.isActive && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">Inactiva</span>
                      )}
                    </div>
                    {renderOfferPrice(offer)}
                    {linked && (
                      <p className="text-[10px] text-gray-600 mt-0.5">→ {linked.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveOffer(offer.id, 'up')}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-xs"
                      title="Mover arriba"
                    >
                      &#9650;
                    </button>
                    <button
                      onClick={() => moveOffer(offer.id, 'down')}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-xs"
                      title="Mover abajo"
                    >
                      &#9660;
                    </button>
                    <button
                      onClick={() => startEdit(offer)}
                      className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && editingOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingOffer.id ? 'Editar oferta' : editingOffer.type === 'quantity' ? 'Oferta por cantidad' : 'Agregar add-on'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingOffer(null); }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editingOffer.name || ''}
                  onChange={(e) => setEditingOffer(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder={editingOffer.type === 'quantity' ? 'Ej: Pack x3' : 'Ej: Add-on especial'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio original (S/) *</label>
                  <input
                    type="number"
                    value={editingOffer.compareAtPrice ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      setEditingOffer(prev => {
                        if (!prev) return prev;
                        const updated = { ...prev, compareAtPrice: val };
                        if (val !== null && prev.discountPercent) {
                          updated.price = parseFloat((val * (1 - prev.discountPercent / 100)).toFixed(2));
                        }
                        return updated;
                      });
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    value={editingOffer.discountPercent ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      setEditingOffer(prev => {
                        if (!prev) return prev;
                        const updated = { ...prev, discountPercent: val };
                        if (val !== null && prev.compareAtPrice) {
                          updated.price = parseFloat((prev.compareAtPrice * (1 - val / 100)).toFixed(2));
                        }
                        return updated;
                      });
                    }}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {(editingOffer.compareAtPrice != null && editingOffer.compareAtPrice > 0) && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Precio final</span>
                    <div className="flex items-center gap-2">
                      {editingOffer.discountPercent != null && editingOffer.discountPercent > 0 && (
                        <span className="text-xs text-gray-500 line-through">S/ {editingOffer.compareAtPrice!.toFixed(2)}</span>
                      )}
                      <span className="text-sm font-bold text-green-400">S/ {(editingOffer.price ?? 0).toFixed(2)}</span>
                      {editingOffer.discountPercent != null && editingOffer.discountPercent > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">
                          -{editingOffer.discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {editingOffer.type === 'quantity' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={editingOffer.quantity || 1}
                    onChange={(e) => setEditingOffer(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 1 } : prev)}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {editingOffer.type === 'addon' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Producto vinculado</label>
                  <select
                    value={editingOffer.linkedProductId || ''}
                    onChange={(e) => setEditingOffer(prev => prev ? { ...prev, linkedProductId: e.target.value || null } : prev)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Ninguno</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (S/ {p.price.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">Imagen</label>
                <div className="flex items-center gap-3">
                  {editingOffer.imageUrl ? (
                    <div className="relative">
                      <img src={editingOffer.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      <button
                        onClick={() => setEditingOffer(prev => prev ? { ...prev, imageUrl: null } : prev)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-lg bg-gray-800 border border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                      {imageUploading ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : (
                        <>
                          <Image size={16} className="text-gray-500" />
                          <span className="text-[10px] text-gray-500 mt-0.5">Subir</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white cursor-pointer hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={editingOffer.isActive ?? true}
                    onChange={(e) => setEditingOffer(prev => prev ? { ...prev, isActive: e.target.checked } : prev)}
                    className="rounded bg-gray-700 border-gray-600 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-400">Activa</span>
                </label>
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
                disabled={saving || !editingOffer.name || !editingOffer.compareAtPrice || editingOffer.compareAtPrice <= 0}
                className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingOffer.id ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
