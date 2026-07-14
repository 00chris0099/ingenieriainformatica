'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit, Trash2, Loader2, MoreVertical, Copy, Download, Upload } from 'lucide-react';
import ProductForm from '@/components/catalogo/ProductForm';
import ImportExportDialog from '@/components/catalogo/ImportExportDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import SearchBar from '@/components/ui/SearchBar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function CatalogoPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [fetchProducts, fetchCategories]);

  const handleSave = async (data: any) => {
    console.log('[Catalogo] handleSave:', JSON.stringify({ name: data.name, prices: data.prices, enabledPriceTypes: data.enabledPriceTypes, variants: data.variants?.length }));
    const url = editingProduct ? `/api/v1/products/${editingProduct.id}` : '/api/v1/products';
    const method = editingProduct ? 'PUT' : 'POST';
    const payload = {
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      model: data.model,
      description: data.description,
      shortDescription: data.shortDescription,
      brand: data.brand,
      categoryId: data.categoryId,
      status: data.status,
      tags: data.tags,
      images: data.images,
      mainImageIndex: data.mainImageIndex,
      height: data.height,
      width: data.width,
      depth: data.depth,
      color: data.color,
      materials: data.materials,
      recommendedAge: data.recommendedAge,
      warrantyDays: data.warrantyDays,
      originCountry: data.originCountry,
      weight: data.weight,
      weightUnit: data.weightUnit,
      lowStockAlert: data.lowStockAlert,
      discountPopup: data.discountPopup,
      variants: data.variants,
      prices: data.prices,
      enabledPriceTypes: data.enabledPriceTypes,
    };
    console.log('[Catalogo] Payload prices:', payload.prices, 'enabledTypes:', payload.enabledPriceTypes);
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Catalogo] Response status:', res.status);
    if (!res.ok) {
      const err = await res.text();
      console.error('[Catalogo] Error response:', err);
      throw new Error('Failed to save');
    }
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/v1/products/${deleteConfirm.id}`, { method: 'DELETE' });
      fetchProducts();
      showToast('Producto archivado', 'success');
    } catch { showToast('Error al archivar', 'error'); }
    setDeleteConfirm({ open: false, id: '' });
  };

  const handleDuplicate = async (productId: string) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Producto duplicado', 'success');
        fetchProducts();
      }
    } catch (err) {
      showToast('Error al duplicar', 'error');
    }
  };

  const startEdit = async (product: any) => {
    // Load landing page blocks
    let landingBlocks: any[] = [];
    try {
      const slug = product.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const res = await fetch(`/api/v1/landings/${slug}`);
      if (res.ok) {
        const data = await res.json();
        landingBlocks = data.data?.blocks || [];
      }
    } catch (err) {
      console.error('Failed to load landing page:', err);
    }

    setEditingProduct({
      ...product,
      model: product.model || '',
      shortDescription: product.shortDescription || '',
      productImages: product.images || [],
      mainImageIndex: product.mainImageIndex || 0,
      dimensions: {
        height: product.height || null,
        width: product.width || null,
        depth: product.depth || null,
      },
      color: product.color || '',
      materials: product.materials || [],
      recommendedAge: product.recommendedAge || '',
      warrantyDays: product.warrantyDays || null,
      originCountry: product.originCountry || '',
      weight: product.weight || null,
      weightUnit: product.weightUnit || 'kg',
      lowStockAlert: product.lowStockAlert || null,
      discountPopup: product.discountPopup || {
        enabled: false,
        title: 'Oferta especial!',
        description: 'Obtén un descuento exclusivo en este producto',
        discountPercent: 10,
        ctaText: 'Comprar ahora',
        ctaUrl: '#',
        imageUrl: '',
        bgColor: '#16a34a',
        textColor: '#ffffff',
      },
      prices: {
        main: product.variants?.[0]?.price || 0,
        especial: product.priceConfig?.especial ?? null,
        descuento: product.priceConfig?.descuento ?? null,
        mayorista: product.priceConfig?.mayorista ?? null,
      },
      enabledPriceTypes: product.priceConfig?.enabledTypes || [],
      ctaText: product.priceConfig?.ctaText || '¡Lo quiero ahora!',
      crossSellProductIds: product.priceConfig?.crossSellProductIds || [],
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compareAtPrice: v.compareAtPrice || null,
        isActive: v.isActive !== false,
        images: v.images || [],
        attributes: v.attributes || {},
      })),
      variantPricingMode: 'same',
      landingBlocks: landingBlocks,
    });
    setShowForm(true);
    setShowMenu(null);
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Catalogo de Productos</h2>
          <p className="text-sm text-gray-400">{products.length} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportExportMode('export')}
            className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Download size={16} /> Exportar
          </button>
          <button
            onClick={() => setImportExportMode('import')}
            className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors">
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o SKU..." />

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          initialData={editingProduct}
          productId={editingProduct?.id}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
          mode={editingProduct ? 'edit' : 'create'}
        />
      )}

      {/* Loading */}
      {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>}

      {/* Product List - Mobile */}
      {!loading && (
        <div className="lg:hidden space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex gap-3">
                <img src={product.images?.[0] || ''}
                  alt="" className="w-14 h-14 rounded-lg object-cover bg-gray-800 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                    </div>
                    <button onClick={() => setShowMenu(showMenu === product.id ? null : product.id)}
                      className="text-gray-500 hover:text-white p-1 shrink-0"><MoreVertical size={16} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const mainPrice = Number(product.variants?.[0]?.price) || 0;
                        const hasDesc = product.priceConfig?.enabledTypes?.includes('descuento') && product.priceConfig?.descuento != null && product.priceConfig.descuento > 0;
                        const hasEsp = product.priceConfig?.enabledTypes?.includes('especial') && product.priceConfig?.especial != null;
                        const finalPrice = hasEsp ? Number(product.priceConfig.especial) : hasDesc ? Math.round(mainPrice * (1 - product.priceConfig.descuento / 100) * 100) / 100 : mainPrice;
                        const showStrike = (hasDesc || hasEsp) && finalPrice < mainPrice;
                        return (
                          <>
                            {showStrike && <span className="text-xs text-gray-500 line-through">S/ {mainPrice}</span>}
                            <span className={`font-bold text-sm ${showStrike ? 'text-green-400' : 'text-brand-400'}`}>S/ {finalPrice}</span>
                            {hasDesc && <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-md font-medium">-{product.priceConfig.descuento}%</span>}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        product.totalStock > 10 ? 'bg-green-500/20 text-green-400' :
                        product.totalStock > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{product.totalStock} uds</span>
                      <StatusBadge status={product.status} />
                    </div>
                  </div>
                  {product.priceConfig?.enabledTypes?.includes('mayorista') && product.priceConfig?.mayorista != null && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-md font-medium">Mayorista: S/ {product.priceConfig.mayorista}</span>
                  )}
                </div>
              </div>
              {showMenu === product.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                  <button onClick={() => startEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700">
                    <Edit size={14} /> Editar
                  </button>
                  <button onClick={() => handleDuplicate(product.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 hover:bg-gray-700">
                    <Copy size={14} /> Duplicar
                  </button>
                  <button onClick={() => setDeleteConfirm({ open: true, id: product.id })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-900/30 rounded-lg text-xs text-red-400 hover:bg-red-900/50">
                    <Trash2 size={14} /> Archivar
                  </button>
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Package size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No se encontraron productos</p></div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      {!loading && (
        <div className="hidden lg:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Producto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Categoria</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Precio</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0] || ''}
                        alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                      <span className="text-sm font-medium text-white truncate">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{product.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{product.category || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {(() => {
                      const mainPrice = Number(product.variants?.[0]?.price) || 0;
                      const hasDesc = product.priceConfig?.enabledTypes?.includes('descuento') && product.priceConfig?.descuento != null && product.priceConfig.descuento > 0;
                      const hasEsp = product.priceConfig?.enabledTypes?.includes('especial') && product.priceConfig?.especial != null;
                      const finalPrice = hasEsp ? Number(product.priceConfig.especial) : hasDesc ? Math.round(mainPrice * (1 - product.priceConfig.descuento / 100) * 100) / 100 : mainPrice;
                      const showStrike = (hasDesc || hasEsp) && finalPrice < mainPrice;
                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {showStrike && <span className="text-xs text-gray-500 line-through">S/ {mainPrice}</span>}
                            <span className={`text-sm font-medium ${showStrike ? 'text-green-400' : 'text-brand-400'}`}>S/ {finalPrice}</span>
                            {hasDesc && <span className="text-[10px] px-1 py-0.5 bg-orange-500/20 text-orange-400 rounded font-medium">-{product.priceConfig.descuento}%</span>}
                          </div>
                          {product.priceConfig?.enabledTypes?.includes('mayorista') && product.priceConfig?.mayorista != null && (
                            <span className="text-[10px] text-blue-400">May: S/ {product.priceConfig.mayorista}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${product.totalStock > 10 ? 'text-green-400' : product.totalStock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>{product.totalStock}</span>
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(product)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"><Edit size={14} /></button>
                      <button onClick={() => handleDuplicate(product.id)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"><Copy size={14} /></button>
                      <button onClick={() => setDeleteConfirm({ open: true, id: product.id })} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Package size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No se encontraron productos</p></div>
          )}
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="Archivar Producto"
        message="Este producto se archivara y no sera visible en la tienda. Puedes restaurarlo despues."
        confirmLabel="Archivar"
        variant="danger"
      />

      {/* Import/Export Dialog */}
      <ImportExportDialog
        isOpen={importExportMode !== null}
        onClose={() => setImportExportMode(null)}
        mode={importExportMode || 'export'}
        onImportComplete={fetchProducts}
      />
    </div>
  );
}
