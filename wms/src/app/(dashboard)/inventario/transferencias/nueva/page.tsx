'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ArrowRightLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [form, setForm] = useState({
    variantId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: 0,
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
          setProducts(Array.isArray(data.data) ? data.data : []);
        }
        if (whRes.ok) {
          const data = await whRes.json();
          setWarehouses(Array.isArray(data.data) ? data.data : []);
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
    if (!form.variantId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0) return;
    if (form.fromWarehouseId === form.toWarehouseId) return;

    setSaving(true);
    try {
      const res = await fetch('/api/v1/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/inventario');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <PageHeader title="Nueva Transferencia" description="Mover stock entre almacenes" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Producto</label>
          <select value={form.variantId} onChange={(e) => setForm({ ...form, variantId: e.target.value })}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">Seleccionar producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.variants?.[0]?.id || p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Origen</label>
            <select value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Seleccionar...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Destino</label>
            <select value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Seleccionar...</option>
              {warehouses.filter((w) => w.id !== form.fromWarehouseId).map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
          <input type="number" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            min="1" className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notas</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" rows={2}
            placeholder="Motivo de la transferencia..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.variantId || !form.fromWarehouseId || !form.toWarehouseId || form.quantity <= 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl text-sm text-white font-medium transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
            Transferir
          </button>
        </div>
      </div>
    </div>
  );
}
