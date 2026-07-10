'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FormSelect } from '@/components/ui/FormField';

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  warehouses: any[];
  onTransfer: (data: any) => Promise<void>;
}

export default function TransferDialog({ open, onClose, warehouses, onTransfer }: TransferDialogProps) {
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!fromWarehouse || !toWarehouse || !variantSku || quantity <= 0) return;
    setSaving(true);
    await onTransfer({ fromWarehouseId: fromWarehouse, toWarehouseId: toWarehouse, variantSku, quantity });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-lg font-semibold text-white mb-4">Transferir Stock</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Almacen origen</label>
            <select value={fromWarehouse} onChange={(e) => setFromWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              <option value="">Seleccionar...</option>
              {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Almacen destino</label>
            <select value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              <option value="">Seleccionar...</option>
              {warehouses.filter((w: any) => w.id !== fromWarehouse).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">SKU del producto</label>
            <input type="text" value={variantSku} onChange={(e) => setVariantSku(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="ADK-BEB-001-STD" />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Cantidad</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !fromWarehouse || !toWarehouse || !variantSku}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Transferiendo...' : 'Transferir'}
          </button>
        </div>
      </div>
    </div>
  );
}
