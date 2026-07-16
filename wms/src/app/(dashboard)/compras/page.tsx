'use client';

import { Truck, Plus, Search, Loader2, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

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

  function handleNew() {
    setEditingSupplier(null);
    setShowModal(true);
  }

  function handleEdit(supplier: any) {
    setEditingSupplier(supplier);
    setShowModal(true);
  }

  async function handleDelete(supplier: any) {
    if (!confirm(`Eliminar proveedor "${supplier.name}"?`)) return;
    try {
      await fetch(`/api/v1/suppliers/${supplier.id}`, { method: 'DELETE' });
      fetchSuppliers();
    } catch (error) {
      alert('Error al eliminar');
    }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Compras / Proveedores</h2>
          <p className="text-sm text-gray-400">{suppliers.length} proveedores</p>
        </div>
        <button onClick={handleNew} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
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
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(sup)} className="p-1 text-gray-400 hover:text-white rounded"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(sup)} className="p-1 text-gray-400 hover:text-red-400 rounded"><Trash2 size={14} /></button>
                </div>
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

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setShowModal(false); setEditingSupplier(null); }}
          onSaved={() => { setShowModal(false); setEditingSupplier(null); fetchSuppliers(); }}
        />
      )}
    </div>
  );
}

function SupplierModal({ supplier, onClose, onSaved }: { supplier: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: supplier?.name || '',
    code: supplier?.code || '',
    ruc: supplier?.ruc || '',
    supplierType: supplier?.supplierType || 'manufacturer',
    country: supplier?.country || 'Peru',
    address: supplier?.address || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    contactName: supplier?.contactName || '',
    category: supplier?.category || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const url = supplier ? `/api/v1/suppliers/${supplier.id}` : '/api/v1/suppliers';
      const method = supplier ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Codigo</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">RUC</label>
            <input value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2">
              <option value="manufacturer">Fabricante</option>
              <option value="distributor">Distribuidor</option>
              <option value="wholesale">Mayorista</option>
              <option value="retail">Minorista</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pais</label>
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Direccion</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefono</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contacto</label>
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
