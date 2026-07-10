'use client';

import { useState } from 'react';
import { X, Loader2, Minus, Plus } from 'lucide-react';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/FormField';

interface StockAdjustDialogProps {
  open: boolean;
  onClose: () => void;
  item: any;
  onAdjust: (data: any) => Promise<void>;
}

export default function StockAdjustDialog({ open, onClose, item, onAdjust }: StockAdjustDialogProps) {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('adjustment');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    await onAdjust({ variantId: item?.variantId, warehouseId: item?.warehouseId, quantity: adjustment, type, reason });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-lg font-semibold text-white mb-4">Ajustar Stock</h3>
        <p className="text-sm text-gray-400 mb-4">{item?.variantName} - Stock actual: {item?.availableQuantity}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo de movimiento</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              <option value="adjustment">Ajuste</option>
              <option value="purchase">Compra</option>
              <option value="sale">Venta</option>
              <option value="return">Devolucion</option>
              <option value="damaged">Danado</option>
              <option value="cycle_count">Conteo ciclico</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cantidad (+ para agregar, - para restar)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setAdjustment(adjustment - 1)} className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700"><Minus size={16} /></button>
              <input type="number" value={adjustment} onChange={(e) => setAdjustment(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button onClick={() => setAdjustment(adjustment + 1)} className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-700"><Plus size={16} /></button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Razon</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Describe el motivo del ajuste..." />
          </div>

          <div className="bg-gray-800 rounded-lg p-3 text-sm">
            <p className="text-gray-400">Stock resultado: <span className="text-white font-medium">{item?.availableQuantity + adjustment}</span></p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving || adjustment === 0}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Aplicar Ajuste'}
          </button>
        </div>
      </div>
    </div>
  );
}
