'use client';

import { useState, useEffect, useCallback } from 'react';
import { Warehouse, Search, Loader2, Plus, Layers, Hash, ArrowRightLeft, AlertTriangle, Package } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

type Tab = 'stock' | 'lots' | 'serials' | 'transfers';

export default function InventarioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('stock');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Stock state
  const [inventory, setInventory] = useState<any[]>([]);

  // Lots state
  const [lots, setLots] = useState<any[]>([]);

  // Serial numbers state
  const [serials, setSerials] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, lotsRes, serialsRes] = await Promise.all([
        fetch(`/api/v1/inventory?limit=100${search ? `&q=${search}` : ''}`),
        fetch(`/api/v1/lots?limit=100`),
        fetch(`/api/v1/serial-numbers?limit=100`),
      ]);

      if (invRes.ok) {
        const data = await invRes.json();
        setInventory(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
      if (lotsRes.ok) {
        const data = await lotsRes.json();
        setLots(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
      if (serialsRes.ok) {
        const data = await serialsRes.json();
        setSerials(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs: Array<{ key: Tab; label: string; icon: any; count: number }> = [
    { key: 'stock', label: 'Stock', icon: Package, count: inventory.length },
    { key: 'lots', label: 'Lotes', icon: Layers, count: lots.length },
    { key: 'serials', label: 'Series', icon: Hash, count: serials.length },
    { key: 'transfers', label: 'Transferencias', icon: ArrowRightLeft, count: 0 },
  ];

  const lowStockCount = inventory.filter(i => i.availableQuantity <= i.reorderPoint).length;

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Inventario"
        description={`${inventory.length} productos - ${lowStockCount} con stock bajo`}
      />

      {/* Alert */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300">{lowStockCount} productos con stock bajo o agotado</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por SKU, nombre o lote..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          {/* Stock Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-3">
              {inventory.length === 0 ? (
                <EmptyState
                  icon={<Package size={48} />}
                  title="Sin inventario"
                  description="El inventario se crea automaticamente al agregar productos"
                />
              ) : (
                inventory.map((item) => {
                  const isLow = item.availableQuantity <= item.reorderPoint;
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
                              {item.variant?.name || item.productName}
                            </p>
                            {isLow && <AlertTriangle size={14} className="text-yellow-400 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500">{item.variant?.sku || item.sku}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-green-400'}`}>
                            {item.availableQuantity}
                          </p>
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
                })
              )}
            </div>
          )}

          {/* Lots Tab */}
          {activeTab === 'lots' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/inventario/lotes/nuevo"
                  className="flex items-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-700"
                >
                  <Plus size={16} /> Nuevo Lote
                </Link>
              </div>
              {lots.length === 0 ? (
                <EmptyState
                  icon={<Layers size={48} />}
                  title="Sin lotes"
                  description="Los lotes permiten rastrear fechas de vencimiento y lotes de fabricacion"
                  action={
                    <Link href="/inventario/lotes/nuevo" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">
                      <Plus size={16} /> Crear Primer Lote
                    </Link>
                  }
                />
              ) : (
                lots.map((lot) => (
                  <div key={lot.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-400">{lot.lotNumber}</p>
                        <p className="text-sm text-gray-400 mt-1">{lot.variant?.name}</p>
                        <p className="text-xs text-gray-500">Cantidad: {lot.quantity} | Disponible: {lot.availableQty}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        lot.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        lot.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {lot.status}
                      </span>
                    </div>
                    {lot.expirationDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Vence: {new Date(lot.expirationDate).toLocaleDateString('es-PE')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Serial Numbers Tab */}
          {activeTab === 'serials' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/inventario/series/nueva"
                  className="flex items-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-700"
                >
                  <Plus size={16} /> Nueva Serie
                </Link>
              </div>
              {serials.length === 0 ? (
                <EmptyState
                  icon={<Hash size={48} />}
                  title="Sin numeros de serie"
                  description="Los numeros de serie permiten rastrear unidades individuales de productos de alto valor"
                  action={
                    <Link href="/inventario/series/nueva" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">
                      <Plus size={16} /> Registrar Primera Serie
                    </Link>
                  }
                />
              ) : (
                serials.map((sn) => (
                  <div key={sn.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-400 font-mono">{sn.serialNumber}</p>
                        <p className="text-sm text-gray-400 mt-1">{sn.variant?.name}</p>
                        <p className="text-xs text-gray-500">Almacen: {sn.warehouse?.code || '-'}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sn.status === 'available' ? 'bg-green-500/20 text-green-400' :
                        sn.status === 'sold' ? 'bg-blue-500/20 text-blue-400' :
                        sn.status === 'damaged' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {sn.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Transfers Tab */}
          {activeTab === 'transfers' && (
            <EmptyState
              icon={<ArrowRightLeft size={48} />}
              title="Transferencias"
              description="Mueve stock entre ubicaciones del almacen"
              action={
                <Link href="/inventario/transferencias/nueva" className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700">
                  <Plus size={16} /> Nueva Transferencia
                </Link>
              }
            />
          )}
        </>
      )}
    </div>
  );
}
