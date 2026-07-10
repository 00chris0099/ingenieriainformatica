'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Search, Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minPurchase: 0,
    maxDiscount: '',
    usageLimit: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleSubmit = async () => {
    if (!form.code || !form.discountValue) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount as string) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit as string) : null,
        }),
      });
      if (res.ok) {
        fetchCoupons();
        setShowForm(false);
        setForm({
          code: '', description: '', discountType: 'percentage', discountValue: 10,
          minPurchase: 0, maxDiscount: '', usageLimit: '',
          validFrom: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/v1/coupons?id=${id}`, { method: 'DELETE' });
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Cupones de Descuento"
        description={`${coupons.length} cupones activos`}
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={18} /> Nuevo Cupon
          </button>
        }
      />

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Crear Cupon</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Codigo *</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="EJEMPLO10" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de Descuento</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (S/)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor del Descuento *</label>
              <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                min="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Compra Minima (S/)</label>
              <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: parseFloat(e.target.value) || 0 })}
                min="0" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descuento de temporada" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valido Desde</label>
              <input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valido Hasta</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving || !form.code}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />} Crear Cupon
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : coupons.length === 0 ? (
        <EmptyState icon={<Tag size={48} />} title="No hay cupones" description="Crea cupones para ofrecer descuentos a tus clientes" />
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const now = new Date();
            const isValid = coupon.isActive && now >= new Date(coupon.validFrom) && now <= new Date(coupon.validUntil);
            const isExpired = now > new Date(coupon.validUntil);
            return (
              <div key={coupon.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-brand-400">{coupon.code}</span>
                      {isValid ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Activo</span>
                      ) : isExpired ? (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expirado</span>
                      ) : (
                        <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Inactivo</span>
                      )}
                    </div>
                    {coupon.description && <p className="text-sm text-gray-400 mt-1">{coupon.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `S/ ${coupon.discountValue}`}</span>
                      {coupon.minPurchase > 0 && <span>Min: S/ {coupon.minPurchase}</span>}
                      <span>{coupon.usedCount}/{coupon.usageLimit || '∞'} usos</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
