'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit, Trash2, MoreVertical, Copy, Download, Upload } from 'lucide-react';
import ProductForm from '@/components/catalogo/ProductForm';
import ImportExportDialog from '@/components/catalogo/ImportExportDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

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
    const url = editingProduct ? `/api/v1/products/${editingProduct.id}` : '/api/v1/products';
    const method = editingProduct ? 'PUT' : 'POST';
    const payload = {
      sku: data.sku, name: data.name, slug: data.slug, model: data.model,
      description: data.description, shortDescription: data.shortDescription,
      brand: data.brand, categoryId: data.categoryId, status: data.status,
      tags: data.tags, images: data.images, mainImageIndex: data.mainImageIndex,
      height: data.height, width: data.width, depth: data.depth, color: data.color,
      materials: data.materials, recommendedAge: data.recommendedAge,
      warrantyDays: data.warrantyDays, originCountry: data.originCountry,
      weight: data.weight, weightUnit: data.weightUnit, stock: data.stock,
      lowStockAlert: data.lowStockAlert, price: data.price,
      compareAtPrice: data.compareAtPrice, discountPercent: data.discountPercent,
      costPrice: data.costPrice, barcode: data.barcode, discountPopup: data.discountPopup,
      promotionBar: data.promotionBar, socialProof: data.socialProof,
      ctaText: data.ctaText, crossSellProductIds: data.crossSellProductIds,
    };
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
      const res = await fetch(`/api/v1/products/${productId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        showToast('Producto duplicado', 'success');
        fetchProducts();
      }
    } catch { showToast('Error al duplicar', 'error'); }
  };

  const startEdit = (product: any) => {
    setEditingProduct({
      ...product,
      model: product.model || '',
      shortDescription: product.shortDescription || '',
      productImages: product.images || [],
      mainImageIndex: product.mainImageIndex || 0,
      dimensions: { height: product.height || null, width: product.width || null, depth: product.depth || null },
      color: product.color || '',
      materials: product.materials || [],
      recommendedAge: product.recommendedAge || '',
      warrantyDays: product.warrantyDays || null,
      originCountry: product.originCountry || '',
      weight: product.weight || null,
      weightUnit: product.weightUnit || 'kg',
      stock: product.stock ?? 0,
      lowStockAlert: product.lowStockAlert || null,
      price: product.price ?? 0,
      discountPercent: product.discountPercent ?? 0,
      costPrice: product.costPrice ?? null,
      barcode: product.barcode || '',
      tags: product.tags || [],
      discountPopup: product.discountPopup || {
        enabled: false, title: 'Oferta especial!',
        description: 'Obtén un descuento exclusivo en este producto',
        discountPercent: 10, ctaText: 'Comprar ahora', ctaUrl: '#', imageUrl: '',
        bgColor: '#16a34a', textColor: '#ffffff',
      },
      ctaText: product.ctaText || '¡Lo quiero ahora!',
      crossSellProductIds: product.crossSellProductIds || [],
      promotionBar: product.promotionBar || {
        enabled: false,
        message: '¡Oferta por tiempo limitado! Quedan {hours}h {minutes}m {seconds}s',
        hours: 24, bgColor: '#dc2626', textColor: '#ffffff',
      },
      socialProof: product.socialProof || {
        enabled: false, interval: 5,
        messages: ['{name} de {city} compró este producto', '{name} de {city} acabó de comprar', '{name} de {city} se lo llevó'],
        avatars: [],
      },
    });
    setShowForm(true);
    setShowMenu(null);
  };

  const getStockBadge = (stock: number) => {
    if (stock > 10) return <Badge variant="success">{stock} uds</Badge>;
    if (stock > 0) return <Badge variant="warning">{stock} uds</Badge>;
    return <Badge variant="error">{stock} uds</Badge>;
  };

  const getPriceDisplay = (product: any) => {
    const mainPrice = Number(product.price) || 0;
    const hasDiscount = product.discountPercent != null && product.discountPercent > 0;
    const effectivePrice = hasDiscount
      ? Math.round(mainPrice * (1 - product.discountPercent / 100) * 100) / 100
      : mainPrice;
    const showStrike = hasDiscount && product.compareAtPrice != null;
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5">
          {showStrike && <span className="text-xs text-[var(--color-text-tertiary)] line-through">S/ {product.compareAtPrice}</span>}
          <span className={`text-sm font-medium ${hasDiscount ? 'text-[var(--color-success)]' : 'text-[var(--color-accent)]'}`}>
            S/ {effectivePrice}
          </span>
          {hasDiscount && (
            <Badge variant="warning" className="text-[10px]">-{product.discountPercent}%</Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">Catalogo de Productos</h2>
          <p className="text-sm text-[var(--color-text-tertiary)]">{products.length} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={() => setImportExportMode('export')}>
            Exportar
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setImportExportMode('import')}>
            Importar
          </Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

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

      {loading && <TableSkeleton rows={5} columns={6} />}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={<Package size={24} />}
          title="No se encontraron productos"
          description="Crea tu primer producto para empezar a vender"
          action={{ label: 'Nuevo Producto', onClick: () => { setEditingProduct(null); setShowForm(true); } }}
        />
      )}

      {!loading && (
        <>
          {/* Mobile */}
          <div className="lg:hidden space-y-3 stagger-children">
            {products.map((product) => (
              <div key={product.id} className="surface-card p-4 group">
                <div className="flex gap-3">
                  <img src={product.images?.[0] || ''}
                    alt="" className="w-14 h-14 rounded-lg object-cover bg-[var(--color-bg-hover)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{product.name}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] font-mono">{product.sku}</p>
                      </div>
                      <button onClick={() => setShowMenu(showMenu === product.id ? null : product.id)}
                        className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 shrink-0 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {getPriceDisplay(product)}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStockBadge(product.stock ?? 0)}
                        <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
                          {product.status === 'active' ? 'Activo' : product.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                {showMenu === product.id && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                    <Button variant="ghost" size="sm" className="flex-1" icon={<Edit size={14} />}
                      onClick={() => startEdit(product)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="flex-1" icon={<Copy size={14} />}
                      onClick={() => handleDuplicate(product.id)}>Duplicar</Button>
                    <Button variant="danger" size="sm" className="flex-1" icon={<Trash2 size={14} />}
                      onClick={() => setDeleteConfirm({ open: true, id: product.id })}>Archivar</Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block surface-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0] || ''}
                          alt="" className="w-10 h-10 rounded-lg object-cover bg-[var(--color-bg-hover)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[var(--color-text-tertiary)]">{product.sku}</td>
                    <td className="text-[var(--color-text-secondary)]">{product.category || '-'}</td>
                    <td className="text-right">{getPriceDisplay(product)}</td>
                    <td className="text-right">{getStockBadge(product.stock ?? 0)}</td>
                    <td className="text-center">
                      <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
                        {product.status === 'active' ? 'Activo' : product.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(product)}
                          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDuplicate(product.id)}
                          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ open: true, id: product.id })}
                          className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error-muted)] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '' })}
        onConfirm={handleDelete}
        title="Archivar Producto"
        message="Este producto se archivara y no sera visible en la tienda. Puedes restaurarlo despues."
        confirmLabel="Archivar"
        variant="danger"
      />

      <ImportExportDialog
        isOpen={importExportMode !== null}
        onClose={() => setImportExportMode(null)}
        mode={importExportMode || 'export'}
        onImportComplete={fetchProducts}
      />
    </div>
  );
}
