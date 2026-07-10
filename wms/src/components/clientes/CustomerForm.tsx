'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export default function CustomerForm({ open, onClose, onSave, initialData }: CustomerFormProps) {
  const [form, setForm] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    customerType: initialData?.customerType || 'individual',
    companyName: initialData?.companyName || '',
    taxId: initialData?.taxId || '',
    creditLimit: initialData?.creditLimit || 0,
    notes: initialData?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.fullName) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-lg font-semibold text-white mb-4">{initialData ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Nombre *</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                <option value="individual">Individual</option>
                <option value="business">Empresa</option>
                <option value="importer">Importador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Telefono</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
            </div>
          </div>

          {form.customerType !== 'individual' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Empresa</label>
                <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">RUC/DNI</label>
                <input type="text" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Limite de credito S/</label>
            <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.fullName}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
