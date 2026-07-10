'use client';

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField';

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  customers: any[];
  orders: any[];
}

export default function InvoiceForm({ open, onClose, onSave, customers, orders }: InvoiceFormProps) {
  const [form, setForm] = useState({
    customerId: '', orderId: '', taxAmount: 0, dueDate: '', notes: '',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + form.taxAmount;

  const handleSave = async () => {
    if (!form.customerId || items.length === 0) return;
    setSaving(true);
    await onSave({ customerId: form.customerId, orderId: form.orderId || null, items, taxAmount: form.taxAmount, dueDate: form.dueDate || null, notes: form.notes });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-lg font-semibold text-white mb-4">Crear Factura</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Cliente *</label>
              <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                <option value="">Seleccionar...</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pedido (opcional)</label>
              <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
                <option value="">Sin pedido</option>
                {orders.map((o: any) => <option key={o.id} value={o.id}>{o.orderNumber} - S/ {o.total}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Fecha de vencimiento</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white" />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Items de la factura</label>
              <button onClick={addItem} className="text-xs text-brand-400 hover:text-brand-300">+ Agregar item</button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="Descripcion" className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white" />
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} min={1}
                  className="w-16 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white text-center" />
                <input type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} min={0}
                  className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white text-right" />
                <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 px-1"><X size={14} /></button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Impuestos S/" type="number" value={form.taxAmount || ''} onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value) })} />
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <p className="text-gray-400">Subtotal: <span className="text-white">S/ {subtotal}</span></p>
              <p className="text-gray-400">Impuestos: <span className="text-white">S/ {form.taxAmount}</span></p>
              <p className="font-bold text-brand-400">Total: S/ {total}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.customerId}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Creando...' : 'Crear Factura'}
          </button>
        </div>
      </div>
    </div>
  );
}
