'use client';

import { Truck, Plus, Search, Package, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/suppliers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Compras / Proveedores</h2>
          <p className="text-sm text-gray-400">{suppliers.length} proveedores</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Buscar proveedor..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((sup) => (
            <div key={sup.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{sup.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sup.code} - {sup.country || 'N/A'}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{sup.supplierType}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span>{sup._count?.purchaseOrders || 0} ordenes</span>
                {sup.rating && <span>{'⭐'.repeat(sup.rating)}</span>}
              </div>
              {sup.contactName && <p className="text-xs text-gray-500 mt-2">Contacto: {sup.contactName}</p>}
              {sup.email && <p className="text-xs text-gray-500">{sup.email}</p>}
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500"><Truck size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay proveedores</p></div>
          )}
        </div>
      )}
    </div>
  );
}
