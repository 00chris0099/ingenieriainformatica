'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Hash } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function NuevaSeriePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [form, setForm] = useState({
    serialNumber: '',
    variantId: '',
    warehouseId: '',
    locationCode: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, whRes] = await Promise.all([
          fetch('/api/v1/products?limit=100'),
          fetch('/api/v1/warehouses?limit=100'),
        ]);
        if (prodRes.ok) {
          const data = await prodRes.json();
          setProducts(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
        if (whRes.ok) {
          const data = await whRes.json();
          setWarehouses(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!form.serialNumber || !form.variantId || !form.warehouseId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/serial-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/inventario');
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <PageHeader title="Nueva Serie" description="Registra un numero de serie para un producto" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Numero de Serie *</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="SN-123456789"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Producto *</label>
            <select
              value={form.variantId}
              onChange={(e) => setForm({ ...form, variantId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) =>
                p.variants?.map((v: any) => (
                  <option key={v.id} value={v.id}>{p.name} - {v.sku}</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Almacen *</label>
            <select
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar almacen...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Ubicacion (opcional)</label>
            <input
              type="text"
              value={form.locationCode}
              onChange={(e) => setForm({ ...form, locationCode: e.target.value })}
              placeholder="Estante A-01"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas sobre esta serie..."
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.serialNumber || !form.variantId || !form.warehouseId || saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Hash size={16} />}
          Registrar Serie
        </button>
      </div>
    </div>
  );
}
