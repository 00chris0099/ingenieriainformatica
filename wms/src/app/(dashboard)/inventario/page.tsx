'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Plus, AlertTriangle, Package, Save, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function InventarioPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // New stock modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [newStock, setNewStock] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/inventory?limit=200${search ? `&q=${search}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch products for the add stock modal
  useEffect(() => {
    if (showAddModal) {
      fetch(`/api/v1/products?limit=50${searchProduct ? `&q=${searchProduct}` : ''}`)
        .then(r => r.json())
        .then(data => setProducts(Array.isArray(data.data) ? data.data : []))
        .catch(() => {});
    }
  }, [showAddModal, searchProduct]);

  const handleSaveStock = async (item: any) => {
    const newQty = parseInt(editValue);
    if (isNaN(newQty) || newQty < 0) return;

    setSavingId(item.id);
    try {
      const res = await fetch(`/api/v1/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setInventory(prev => prev.map(inv =>
          inv.id === item.id
            ? { ...inv, quantity: newQty, availableQuantity: newQty - (inv.reservedQuantity || 0) }
            : inv
        ));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
    setSavingId(null);
  };

  const handleAddNewStock = async () => {
    const variantId = selectedVariantId || products.find(p => p.id === selectedProductId)?.variants?.[0]?.id;
    if (!variantId || !newStock) return;
    const qty = parseInt(newStock);
    if (isNaN(qty) || qty < 0) return;

    setSavingNew(true);
    try {
      // Get the first warehouse
      const warehouseRes = await fetch('/api/v1/warehouses?limit=1');
      const warehouseData = await warehouseRes.json();
      const warehouse = warehouseData.data?.[0];
      if (!warehouse) { alert('No hay almacenes configurados'); setSavingNew(false); return; }

      const res = await fetch('/api/v1/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          warehouseId: warehouse.id,
          quantity: qty,
        }),
      });
      if (res.ok) {
        fetchData(); // Refresh the list
        setShowAddModal(false);
        setSelectedProductId('');
        setSelectedVariantId('');
        setNewStock('');
        setSearchProduct('');
      }
    } catch (err) {
      console.error('Failed to add stock:', err);
    }
    setSavingNew(false);
  };

  const lowStockCount = inventory.filter(i => i.availableQuantity <= i.reorderPoint).length;
  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Inventario"
        description={`${inventory.length} productos con stock - ${lowStockCount} con stock bajo`}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={18} /> Asignar Stock
          </button>
        }
      />

      {/* Alert */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300">{lowStockCount} productos con stock bajo o agotado</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por SKU o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Stock List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="Sin inventario"
          description="Asigna stock a tus productos usando el boton de arriba"
          action={
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700"
            >
              <Plus size={16} /> Asignar Primer Stock
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {inventory.map((item) => {
            const isLow = item.availableQuantity <= item.reorderPoint;
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
                  isLow ? 'border-yellow-500/30' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {item.variantName || item.variant?.name || item.productName}
                      </p>
                      {isLow && <AlertTriangle size={14} className="text-yellow-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">{item.variantSku || item.variant?.sku || item.sku}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">Almacen: {item.warehouseName || item.warehouse?.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          min="0"
                          className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveStock(item);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveStock(item)}
                          disabled={savingId === item.id}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {savingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(item.id); setEditValue(String(item.quantity)); }}
                        className={`text-lg font-bold hover:underline cursor-pointer ${isLow ? 'text-yellow-400' : 'text-green-400'}`}
                        title="Click para editar stock"
                      >
                        {item.availableQuantity}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-500">disponible</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>Total: {item.quantity}</span>
                  <span>Reservado: {item.reservedQuantity}</span>
                  <span>Min: {item.reorderPoint}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Asignar Stock a Producto</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-800 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Search product */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Buscar producto</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Nombre del producto..."
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Product list */}
              {products.length > 0 && !selectedProductId && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                    >
                      <img src={p.images?.[0] || ''} alt="" className="w-8 h-8 rounded object-cover bg-gray-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.variants?.length || 0} variante(s)</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected product */}
              {selectedProduct && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={selectedProduct.images?.[0] || ''} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-700" />
                      <div>
                        <p className="text-sm font-medium text-white">{selectedProduct.name}</p>
                        <p className="text-[10px] text-gray-500">{selectedProduct.variants?.length || 0} variante(s)</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedProductId(''); setSelectedVariantId(''); }} className="p-1 text-gray-500 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Variant selector */}
                  {selectedProduct.variants?.length > 1 && (
                    <div className="mt-3">
                      <label className="block text-[10px] text-gray-500 mb-1">Seleccionar variante</label>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Todas las variantes</option>
                        {selectedProduct.variants.map((v: any) => (
                          <option key={v.id} value={v.id}>{v.name || v.sku} - S/ {v.price}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Stock input */}
              {selectedProductId && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cantidad de stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    autoFocus
                  />
                </div>
              )}

              {/* Save button */}
              {selectedProductId && newStock && (
                <button
                  onClick={handleAddNewStock}
                  disabled={savingNew}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingNew ? (
                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><Save size={16} /> Asignar Stock</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
