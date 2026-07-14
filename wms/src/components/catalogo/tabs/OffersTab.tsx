'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProductForm } from '../ProductFormContext';
import { Plus, Trash2, Upload, X, Search, GripVertical, Eye, Check, Package } from 'lucide-react';

const BADGE_OPTIONS = [
  { value: '', label: 'Sin badge' },
  { value: 'Oferta más pedida', label: 'Oferta más pedida' },
  { value: 'Mejor promoción', label: 'Mejor promoción' },
  { value: 'Oferta más vendida', label: 'Oferta más vendida' },
  { value: 'Pack recomendado', label: 'Pack recomendado' },
  { value: 'Ahorra más', label: 'Ahorra más' },
];

interface SuggestedProduct {
  id?: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  imageUrl: string | null;
  type: 'existing' | 'custom';
  linkedProductId: string | null;
}

export default function OffersTab() {
  const { variants, addVariant, updateVariant, removeVariant, ctaText, setCtaText, crossSellProductIds, setCrossSellProductIds, addCrossSellProduct, removeCrossSellProduct, prices, enabledPriceTypes, productId } = useProductForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Suggested Products State
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [showSuggestedForm, setShowSuggestedForm] = useState(false);
  const [suggestedTab, setSuggestedTab] = useState<'existing' | 'custom'>('existing');
  const [newSuggested, setNewSuggested] = useState<SuggestedProduct>({
    name: '',
    description: '',
    price: 0,
    compareAtPrice: null,
    discountPercent: 0,
    imageUrl: null,
    type: 'custom',
    linkedProductId: null,
  });
  const [suggestedSearchQuery, setSuggestedSearchQuery] = useState('');
  const [suggestedSearchResults, setSuggestedSearchResults] = useState<any[]>([]);
  const [showCheckoutPreview, setShowCheckoutPreview] = useState(false);
  const [uploadingSuggested, setUploadingSuggested] = useState(false);

  // Load existing suggested products
  useEffect(() => {
    if (productId) {
      fetch(`/api/v1/suggested-products?product_id=${productId}`)
        .then(r => r.json())
        .then(data => {
          if (data.data) {
            setSuggestedProducts(data.data);
          }
        })
        .catch(() => {});
    }
  }, [productId]);

  const searchProducts = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/v1/products?q=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Search for existing products to suggest
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (suggestedSearchQuery.length >= 2) {
        const res = await fetch(`/api/v1/products?q=${encodeURIComponent(suggestedSearchQuery)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSuggestedSearchResults(Array.isArray(data.data) ? data.data : []);
        }
      } else {
        setSuggestedSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [suggestedSearchQuery]);

  const handleAddOffer = () => {
    addVariant();
  };

  const handleImageUpload = async (variantId: string, file: File) => {
    setUploadingId(variantId);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.data?.url;
        if (url) {
          updateVariant(variantId, { images: [url] });
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploadingId(null);
  };

  const handleSuggestedImageUpload = async (file: File) => {
    setUploadingSuggested(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.data?.url;
        if (url) {
          setNewSuggested(prev => ({ ...prev, imageUrl: url }));
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploadingSuggested(false);
  };

  const handleAddSuggestedProduct = async () => {
    if (!newSuggested.name || newSuggested.price <= 0) return;

    // Fix inverted prices before saving
    let price = newSuggested.price;
    let compareAtPrice = newSuggested.compareAtPrice;
    let discountPercent = newSuggested.discountPercent;

    if (compareAtPrice && compareAtPrice <= price && compareAtPrice > 0) {
      // Swap inverted prices
      [price, compareAtPrice] = [compareAtPrice, price];
      discountPercent = Math.round((1 - price / compareAtPrice) * 100);
    } else if (compareAtPrice && compareAtPrice === price) {
      // Equal prices - no discount
      compareAtPrice = null;
      discountPercent = 0;
    }

    try {
      const res = await fetch('/api/v1/suggested-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          ...newSuggested,
          price,
          compareAtPrice,
          discountPercent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestedProducts(prev => [...prev, data.data]);
        setNewSuggested({
          name: '',
          description: '',
          price: 0,
          compareAtPrice: null,
          discountPercent: 0,
          imageUrl: null,
          type: 'custom',
          linkedProductId: null,
        });
        setShowSuggestedForm(false);
      }
    } catch (err) {
      console.error('Failed to add suggested product:', err);
    }
  };

  const handleAddExistingProduct = async (product: any) => {
    const suggestedData = {
      productId: productId,
      name: product.name,
      description: product.shortDescription || product.description?.substring(0, 100) || '',
      price: product.variants?.[0]?.price || 0,
      compareAtPrice: product.variants?.[0]?.compareAtPrice || null,
      discountPercent: 0,
      imageUrl: product.images?.[0] || null,
      type: 'existing',
      linkedProductId: product.id,
    };

    try {
      const res = await fetch('/api/v1/suggested-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestedData),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestedProducts(prev => [...prev, data.data]);
        setSuggestedSearchQuery('');
        setSuggestedSearchResults([]);
      }
    } catch (err) {
      console.error('Failed to add existing product:', err);
    }
  };

  const handleRemoveSuggested = async (index: number) => {
    const suggested = suggestedProducts[index];
    if (suggested.id) {
      try {
        await fetch(`/api/v1/suggested-products?id=${suggested.id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete suggested product:', err);
      }
    }
    setSuggestedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const calculatedDiscount = prices.descuento
    ? (prices.main * (1 - prices.descuento / 100)).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      {/* CTA Configuration */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Botón de llamada a la acción</label>
        <input
          type="text"
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="¡Lo quiero ahora!"
        />
        <p className="text-xs text-gray-500">Texto que aparece en el botón de compra en la página del producto</p>
      </div>

      {/* Main Offer Info */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Check size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Oferta principal (incluida)</p>
            <p className="text-xs text-gray-500">Esta es la oferta base del producto. Siempre está disponible para el cliente.</p>
          </div>
        </div>
        {variants[0] && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-400">Precio:</span>
            <span className="text-white font-medium">S/ {variants[0].price}</span>
            {variants[0].compareAtPrice && Number(variants[0].compareAtPrice) > Number(variants[0].price) && (
              <>
                <span className="text-gray-500 line-through">S/ {variants[0].compareAtPrice}</span>
                <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">-{Math.round((1 - Number(variants[0].price) / Number(variants[0].compareAtPrice)) * 100)}%</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Additional Offers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Ofertas adicionales (opcionales)</label>
          <button
            onClick={handleAddOffer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus size={14} /> Agregar oferta
          </button>
        </div>
        <p className="text-xs text-gray-500">Estas ofertas son independientes de la principal. El cliente puede elegir una u otra.</p>

        {variants.length <= 1 ? (
          <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-400 mb-2">No hay ofertas adicionales</p>
            <p className="text-xs text-gray-500">Agrega ofertas adicionales como "Pack de 2", "Pack Familiar", etc.</p>
            <button
              onClick={handleAddOffer}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <Plus size={14} /> Crear primera oferta adicional
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.slice(1).map((variant, index) => (
              <div key={variant.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-500 font-mono">#{index + 2}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${variant.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-500'}`}>
                      {variant.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateVariant(variant.id, { isActive: !variant.isActive })}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${variant.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                    >
                      {variant.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => removeVariant(variant.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-1">Nombre de la oferta</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="Pack de 2, Pack Familiar..."
                    />
                  </div>

                  {/* Compare At Price (ORIGINAL - must be higher) */}
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Precio original (S/) <span className="text-orange-400">el mayor</span></label>
                    <input
                      type="number"
                      value={variant.compareAtPrice || ''}
                      onChange={(e) => updateVariant(variant.id, { compareAtPrice: parseFloat(e.target.value) || null })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 150"
                    />
                  </div>

                  {/* Price (SELLING - must be lower) */}
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Precio de venta (S/) <span className="text-green-400">el menor</span></label>
                    <input
                      type="number"
                      value={variant.price || ''}
                      onChange={(e) => updateVariant(variant.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Discount Preview */}
                  {variant.compareAtPrice && variant.compareAtPrice > variant.price && variant.price > 0 && (
                    <div className="col-span-2 flex items-center gap-2 text-xs bg-green-500/10 rounded-lg px-3 py-2">
                      <span className="text-green-400 font-bold">Descuento: {Math.round((1 - variant.price / variant.compareAtPrice) * 100)}% OFF</span>
                      <span className="text-gray-500">|</span>
                      <span className="text-gray-400">S/ {variant.price} <span className="line-through">S/ {variant.compareAtPrice}</span></span>
                    </div>
                  )}
                  {variant.compareAtPrice && variant.compareAtPrice <= variant.price && variant.compareAtPrice > 0 && (
                    <div className="col-span-2 flex items-center gap-2 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                      <span className="text-red-400 font-medium">El precio original debe ser mayor al precio de venta</span>
                    </div>
                  )}

                  {/* Badge */}
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-1">Badge</label>
                    <select
                      value={(variant.attributes as any)?.badge || ''}
                      onChange={(e) => updateVariant(variant.id, { attributes: { ...variant.attributes, badge: e.target.value } })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      {BADGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Image */}
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-1">Imagen de la oferta (1 sola)</label>
                    <div className="flex items-center gap-3">
                      {variant.images?.[0] ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                          <img src={variant.images[0]} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => updateVariant(variant.id, { images: [] })}
                            className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white hover:bg-red-500"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(variant.id, file);
                            }}
                          />
                          {uploadingId === variant.id ? (
                            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={16} className="text-gray-500" />
                          )}
                        </label>
                      )}
                      <div className="text-xs text-gray-500">
                        <p>Solo 1 imagen por oferta</p>
                        {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                          <p className="text-green-400 mt-0.5">
                            Descuento: {Math.round((1 - variant.price / variant.compareAtPrice) * 100)}% OFF
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Products Section */}
      <div className="border-t border-gray-700 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Productos Sugeridos (Upsell)</label>
            <p className="text-xs text-gray-500 mt-1">Agrega productos que aparecerán como tarjetas seleccionables en el checkout</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCheckoutPreview(!showCheckoutPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
            >
              <Eye size={14} /> Vista previa
            </button>
            <button
              onClick={() => setShowSuggestedForm(!showSuggestedForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus size={14} /> Agregar
            </button>
          </div>
        </div>

        {/* Suggested Products Form */}
        {showSuggestedForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-700 pb-2">
              <button
                onClick={() => setSuggestedTab('existing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  suggestedTab === 'existing' ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Producto existente
              </button>
              <button
                onClick={() => setSuggestedTab('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  suggestedTab === 'custom' ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                Crear nuevo
              </button>
            </div>

            {/* Existing Product Tab */}
            {suggestedTab === 'existing' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={suggestedSearchQuery}
                    onChange={(e) => setSuggestedSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Buscar producto existente..."
                  />
                </div>

                {suggestedSearchResults.length > 0 && (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                    {suggestedSearchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddExistingProduct(product)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition-colors text-left"
                      >
                        <img src={product.images?.[0] || ''} alt="" className="w-8 h-8 rounded object-cover bg-gray-800" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-500">S/ {product.variants?.[0]?.price || 0}</p>
                        </div>
                        <Plus size={14} className="text-gray-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom Product Tab */}
            {suggestedTab === 'custom' && (
              <div className="space-y-3">
                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Imagen del producto</label>
                  <div className="flex items-center gap-3">
                    {newSuggested.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                        <img src={newSuggested.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setNewSuggested(prev => ({ ...prev, imageUrl: null }))}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full text-white hover:bg-red-500"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSuggestedImageUpload(file);
                          }}
                        />
                        {uploadingSuggested ? (
                          <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload size={16} className="text-gray-500" />
                        )}
                      </label>
                    )}
                    <div className="text-xs text-gray-500">
                      <p>Imagen del producto sugerido</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Nombre del producto *</label>
                  <input
                    type="text"
                    value={newSuggested.name}
                    onChange={(e) => setNewSuggested(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="Ej: Chupón para bebé"
                  />
                </div>

                {/* Price Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Precio original (S/) <span className="text-orange-400">el mayor</span></label>
                    <input
                      type="number"
                      value={newSuggested.compareAtPrice || ''}
                      onChange={(e) => {
                        const compare = parseFloat(e.target.value) || null;
                        const discount = compare && newSuggested.price > 0 && compare > newSuggested.price
                          ? Math.round((1 - newSuggested.price / compare) * 100)
                          : 0;
                        setNewSuggested(prev => ({ ...prev, compareAtPrice: compare, discountPercent: discount }));
                      }}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 150"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Precio de venta (S/) <span className="text-green-400">el menor</span></label>
                    <input
                      type="number"
                      value={newSuggested.price || ''}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        const discount = newSuggested.compareAtPrice && price > 0 && newSuggested.compareAtPrice > price
                          ? Math.round((1 - price / newSuggested.compareAtPrice) * 100)
                          : 0;
                        setNewSuggested(prev => ({ ...prev, price, discountPercent: discount }));
                      }}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Discount Preview */}
                {newSuggested.compareAtPrice && newSuggested.compareAtPrice > newSuggested.price && newSuggested.price > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-green-500/10 rounded-lg px-3 py-2">
                    <span className="text-green-400 font-bold">-{newSuggested.discountPercent}% OFF</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-400">S/ {newSuggested.price} <span className="line-through">S/ {newSuggested.compareAtPrice}</span></span>
                  </div>
                )}
                {newSuggested.compareAtPrice && newSuggested.compareAtPrice <= newSuggested.price && newSuggested.compareAtPrice > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                    <span className="text-red-400 font-medium">El precio original debe ser mayor al precio de venta</span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">Descripción (máx. 100 caracteres)</label>
                  <textarea
                    value={newSuggested.description}
                    onChange={(e) => setNewSuggested(prev => ({ ...prev, description: e.target.value.substring(0, 100) }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                    rows={2}
                    placeholder="Breve descripción del producto..."
                    maxLength={100}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{newSuggested.description.length}/100</p>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddSuggestedProduct}
                  disabled={!newSuggested.name || newSuggested.price <= 0}
                  className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Agregar producto sugerido
                </button>
              </div>
            )}
          </div>
        )}

        {/* Suggested Products List */}
        {suggestedProducts.length > 0 && (
          <div className="space-y-2">
            {suggestedProducts.map((suggested, index) => (
              <div key={suggested.id || index} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                {suggested.imageUrl ? (
                  <img src={suggested.imageUrl} alt="" className="w-10 h-10 rounded object-cover bg-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                    <Package size={16} className="text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{suggested.name}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    {suggested.compareAtPrice && Number(suggested.compareAtPrice) > Number(suggested.price) && (
                      <span className="text-gray-500 line-through">S/ {suggested.compareAtPrice}</span>
                    )}
                    <span className="text-brand-400 font-medium">S/ {suggested.price}</span>
                    {suggested.discountPercent > 0 && (
                      <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">-{suggested.discountPercent}%</span>
                    )}
                  </div>
                  {suggested.description && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{suggested.description}</p>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${suggested.type === 'existing' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {suggested.type === 'existing' ? 'Existente' : 'Personalizado'}
                </span>
                <button
                  onClick={() => handleRemoveSuggested(index)}
                  className="p-1 text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {suggestedProducts.length === 0 && !showSuggestedForm && (
          <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-6 text-center">
            <Package size={24} className="mx-auto text-gray-600 mb-2" />
            <p className="text-xs text-gray-500">No hay productos sugeridos configurados</p>
            <p className="text-[10px] text-gray-600 mt-1">Los productos sugeridos aparecerán como tarjetas seleccionables en el checkout</p>
          </div>
        )}
      </div>

      {/* Checkout Preview Modal */}
      {showCheckoutPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowCheckoutPreview(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Vista previa del Checkout</h3>
              <button onClick={() => setShowCheckoutPreview(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Mock Checkout */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Resumen del pedido</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Producto principal</span>
                    <span className="font-medium">S/ {prices.main}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Envío</span>
                    <span>Gratis</span>
                  </div>
                </div>
              </div>

              {/* Suggested Products Preview */}
              {suggestedProducts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">¿Te interesa también?</h4>
                  {suggestedProducts.map((suggested, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white border-2 border-blue-500 rounded-xl p-3 cursor-pointer">
                      {suggested.imageUrl ? (
                        <img src={suggested.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{suggested.name}</p>
                        {suggested.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{suggested.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {suggested.compareAtPrice && Number(suggested.compareAtPrice) > Number(suggested.price) && (
                            <span className="text-xs text-gray-400 line-through">S/ {suggested.compareAtPrice}</span>
                          )}
                          <span className="text-sm font-bold text-pink-600">S/ {suggested.price}</span>
                          {suggested.discountPercent > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">-{suggested.discountPercent}%</span>
                          )}
                        </div>
                      </div>
                      <Check size={18} className="text-blue-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="bg-gray-900 rounded-xl p-4 text-white">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">
                    S/ {prices.main + suggestedProducts.reduce((sum, s) => sum + s.price, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Preview */}
      <div className="border-t border-gray-700 pt-6">
        <label className="text-sm font-medium text-gray-300 mb-3 block">Vista previa del CTA</label>
        <div className="bg-gray-900 rounded-xl p-6 text-center">
          <button className="relative px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-lg overflow-hidden" style={{ animation: 'cta-combined 2s ease-in-out infinite' }}>
            <span className="relative z-10">{ctaText || '¡Lo quiero ahora!'}</span>
          </button>
          <style>{`
            @keyframes cta-combined {
              0%, 100% { transform: scale(1); box-shadow: 0 0 5px rgba(34,197,94,0.3); }
              50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(34,197,94,0.6); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

function CrossSellProductItem({ productId, onRemove }: { productId: string; onRemove: () => void }) {
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/v1/products?limit=50`)
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data.data) ? data.data : [];
        setProduct(items.find((p: any) => p.id === productId));
      })
      .catch(() => {});
  }, [productId]);

  if (!product) return <div className="h-10 bg-gray-800 rounded-lg animate-pulse" />;

  return (
    <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
      <img src={product.images?.[0] || ''} alt="" className="w-10 h-10 rounded object-cover bg-gray-700" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{product.name}</p>
        <p className="text-[10px] text-gray-500">S/ {product.variants?.[0]?.price || 0}</p>
      </div>
      <button onClick={onRemove} className="p-1 text-gray-500 hover:text-red-400">
        <X size={14} />
      </button>
    </div>
  );
}
