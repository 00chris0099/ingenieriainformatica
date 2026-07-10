'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function EditarClientePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    taxId: '',
    companyName: '',
    customerType: 'individual',
    billingAddress: {
      street: '',
      city: '',
      department: '',
      district: '',
    },
    creditLimit: 0,
    notes: '',
  });

  const fetchCustomer = useCallback(async () => {
    if (!customerId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/v1/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.data;
        setForm({
          fullName: c.fullName || '',
          email: c.email || '',
          phone: c.phone || '',
          taxId: c.taxId || '',
          companyName: c.companyName || '',
          customerType: c.customerType || 'individual',
          billingAddress: c.billingAddress || { street: '', city: '', department: '', district: '' },
          creditLimit: Number(c.creditLimit) || 0,
          notes: c.notes || '',
        });
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('billingAddress.')) {
      const key = field.split('.')[1];
      setForm({
        ...form,
        billingAddress: { ...form.billingAddress, [key]: value },
      });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName || !customerId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push('/clientes');
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
        <PageHeader title="Editar Cliente" description="Actualiza los datos del cliente" />
      </div>

      {/* Basic Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Informacion Basica</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nombre Completo *</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="999 888 777"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">RUC / DNI</label>
              <input
                type="text"
                value={form.taxId}
                onChange={(e) => handleChange('taxId', e.target.value)}
                placeholder="12345678901"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select
                value={form.customerType}
                onChange={(e) => handleChange('customerType', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="individual">Individual</option>
                <option value="business">Empresa</option>
                <option value="importer">Importador</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Empresa (opcional)</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Direccion</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Calle / Direccion</label>
            <input
              type="text"
              value={form.billingAddress.street}
              onChange={(e) => handleChange('billingAddress.street', e.target.value)}
              placeholder="Av. Principal 123"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
              <input
                type="text"
                value={form.billingAddress.city}
                onChange={(e) => handleChange('billingAddress.city', e.target.value)}
                placeholder="Lima"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Departamento</label>
              <input
                type="text"
                value={form.billingAddress.department}
                onChange={(e) => handleChange('billingAddress.department', e.target.value)}
                placeholder="Lima"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Distrito</label>
              <input
                type="text"
                value={form.billingAddress.district}
                onChange={(e) => handleChange('billingAddress.district', e.target.value)}
                placeholder="Surco"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Credit & Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Credito y Notas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Limite de Credito (S/)</label>
            <input
              type="number"
              value={form.creditLimit}
              onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.fullName || saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Actualizar Cliente
        </button>
      </div>
    </div>
  );
}
