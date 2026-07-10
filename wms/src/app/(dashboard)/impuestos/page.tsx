'use client';

import { useState, useEffect, useCallback } from 'react';
import { Percent, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function ImpuestosPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', rate: 18, isDefault: false });

  const fetchTaxes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/tax-config');
      if (res.ok) {
        const data = await res.json();
        setTaxes(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  const handleSubmit = async () => {
    if (!form.name || form.rate < 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/tax-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { fetchTaxes(); setShowForm(false); setForm({ name: '', rate: 18, isDefault: false }); }
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/v1/tax-config?id=${id}`, { method: 'DELETE' }); setTaxes(taxes.filter(t => t.id !== id)); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Configuracion de Impuestos"
        description="IVA/IGV y otros impuestos"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
            <Plus size={18} /> Nuevo Impuesto
          </button>
        }
      />

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Crear Impuesto</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="IGV" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tasa (%) *</label>
              <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
                min="0" max="100" step="0.01" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500" />
                <span className="text-sm text-gray-300">Por defecto</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving || !form.name}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Percent size={14} />} Guardar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : taxes.length === 0 ? (
        <EmptyState icon={<Percent size={48} />} title="No hay impuestos configurados" description="Configura IGV u otros impuestos para tus facturas" />
      ) : (
        <div className="space-y-3">
          {taxes.map((tax) => (
            <div key={tax.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
                  <Percent size={20} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{tax.name}</p>
                  <p className="text-xs text-gray-500">Tasa: {tax.rate}%</p>
                </div>
                {tax.isDefault && (
                  <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">Por defecto</span>
                )}
              </div>
              <button onClick={() => handleDelete(tax.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Informacion</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• IGV en Peru es 18% (Impuesto General a las Ventas)</li>
          <li>• Los impuestos se aplican automaticamente al checkout</li>
          <li>• Solo puede haber un impuesto por defecto</li>
        </ul>
      </div>
    </div>
  );
}
