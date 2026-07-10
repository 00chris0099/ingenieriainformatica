'use client';

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';

interface CrossSellConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function CrossSellConfig({ open, onClose, onSave }: CrossSellConfigProps) {
  const [rules, setRules] = useState([
    { id: '1', type: 'discount', minQty: 2, discount: 10, description: 'Lleva 2 y ahorra 10%' },
    { id: '2', type: 'discount', minQty: 3, discount: 15, description: 'Lleva 3 y ahorra 15%' },
    { id: '3', type: 'gift', minQty: 5, giftProduct: '', description: 'Lleva 5 y te llevas un regalo' },
  ]);
  const [exitPopup, setExitPopup] = useState({ enabled: true, discount: 10, message: 'Espera! Tenemos algo especial para ti', buttonText: 'Quiero mi descuento' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), type: 'discount', minQty: 1, discount: 0, description: '' }]);
  };

  const updateRule = (id: string, updates: any) => {
    setRules(rules.map((r) => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ crossSellRules: rules, exitPopup });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
        <h3 className="text-lg font-semibold text-white mb-4">Configuracion de Cross-Sell</h3>

        {/* Cross-Sell Rules */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-300">Reglas de Descuento</h4>
            <button onClick={addRule} className="text-xs text-brand-400 hover:text-brand-300">+ Agregar regla</button>
          </div>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                <select value={rule.type} onChange={(e) => updateRule(rule.id, { type: e.target.value })}
                  className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white w-24">
                  <option value="discount">Descuento</option>
                  <option value="gift">Regalo</option>
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Min:</span>
                  <input type="number" value={rule.minQty} onChange={(e) => updateRule(rule.id, { minQty: Number(e.target.value) })} min={1}
                    className="w-12 px-1.5 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center" />
                </div>
                {rule.type === 'discount' && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Desc:</span>
                    <input type="number" value={rule.discount} onChange={(e) => updateRule(rule.id, { discount: Number(e.target.value) })} min={0} max={100}
                      className="w-12 px-1.5 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white text-center" />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                )}
                <input type="text" value={rule.description} onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                  placeholder="Descripcion..." className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white" />
                <button onClick={() => removeRule(rule.id)} className="text-gray-500 hover:text-red-400"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Exit Popup Config */}
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Popup de Retencion</h4>
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={exitPopup.enabled} onChange={(e) => setExitPopup({ ...exitPopup, enabled: e.target.checked })}
                className="rounded border-gray-600 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-white">Activar popup de retencion</span>
            </label>
            {exitPopup.enabled && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mensaje</label>
                  <input type="text" value={exitPopup.message} onChange={(e) => setExitPopup({ ...exitPopup, message: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descuento S/</label>
                    <input type="number" value={exitPopup.discount} onChange={(e) => setExitPopup({ ...exitPopup, discount: Number(e.target.value) })} min={0}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Texto del boton</label>
                    <input type="text" value={exitPopup.buttonText} onChange={(e) => setExitPopup({ ...exitPopup, buttonText: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Guardando...' : 'Guardar Configuracion'}
          </button>
        </div>
      </div>
    </div>
  );
}
