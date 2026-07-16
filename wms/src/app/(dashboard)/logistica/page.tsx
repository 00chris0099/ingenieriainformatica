'use client';

import { Truck, Package, Plus, Loader2, Eye, Edit } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-gray-500/20 text-gray-400', label: 'Pendiente' },
  label_created: { color: 'bg-blue-500/20 text-blue-400', label: 'Guia Creada' },
  picked_up: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Recolectado' },
  in_transit: { color: 'bg-orange-500/20 text-orange-400', label: 'En Transito' },
  out_for_delivery: { color: 'bg-purple-500/20 text-purple-400', label: 'En Entrega' },
  delivered: { color: 'bg-green-500/20 text-green-400', label: 'Entregado' },
  exception: { color: 'bg-red-500/20 text-red-400', label: 'Excepcion' },
};

export default function LogisticaPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/shipments?limit=50');
      if (res.ok) {
        const data = await res.json();
        setShipments(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  function handleNew() {
    setSelectedShipment(null);
    setShowModal(true);
  }

  function handleViewDetail(shipment: any) {
    setSelectedShipment(shipment);
    setShowModal(true);
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Logistica / Envios</h2>
          <p className="text-sm text-gray-400">{shipments.length} envios</p>
        </div>
        <button onClick={handleNew} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
          <Plus size={18} /> Nuevo Envio
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : (
        <div className="space-y-3">
          {shipments.map((ship) => {
            const st = statusConfig[ship.status] || { color: 'bg-gray-500/20 text-gray-400', label: ship.status };
            return (
              <div key={ship.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{ship.shipmentNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{ship.orderNumber || 'Sin orden'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Truck size={12} /> {ship.carrier}</span>
                    </div>
                    {ship.trackingNumber && (
                      <p className="text-xs text-brand-400 mt-2">Tracking: {ship.trackingNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {ship.createdAt && <p className="text-xs text-gray-500 shrink-0">{new Date(ship.createdAt).toLocaleDateString('es-PE')}</p>}
                    <button onClick={() => handleViewDetail(ship)} className="p-1 text-gray-400 hover:text-white rounded"><Eye size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {shipments.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Truck size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay envios</p></div>
          )}
        </div>
      )}

      {showModal && (
        <ShipmentModal
          shipment={selectedShipment}
          onClose={() => { setShowModal(false); setSelectedShipment(null); }}
          onSaved={() => { setShowModal(false); setSelectedShipment(null); fetchShipments(); }}
        />
      )}
    </div>
  );
}

function ShipmentModal({ shipment, onClose, onSaved }: { shipment: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    orderId: shipment?.orderId || '',
    carrier: shipment?.carrier || '',
    trackingNumber: shipment?.trackingNumber || '',
    destAddress: shipment?.shippingAddress?.address || '',
    destDistrict: shipment?.shippingAddress?.district || '',
    destCity: shipment?.shippingAddress?.city || 'Lima',
    destDepartment: shipment?.shippingAddress?.department || 'Lima',
    weight: shipment?.weight || 2,
    notes: shipment?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const isDetail = !!shipment;

  async function handleSave() {
    setSaving(true);
    try {
      const url = shipment ? `/api/v1/shipments/${shipment.id}` : '/api/v1/shipments';
      const method = shipment ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shippingAddress: {
            address: form.destAddress,
            district: form.destDistrict,
            city: form.destCity,
            department: form.destDepartment,
          },
        }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || 'No se pudo guardar'}`);
      }
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">{isDetail ? `Envio ${shipment.shipmentNumber}` : 'Nuevo Envio'}</h2>
        <div className="grid grid-cols-2 gap-3">
          {!isDetail && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">ID de Pedido</label>
              <input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                placeholder="Dejar vacio si no hay pedido asociado"
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Transportista</label>
            <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              placeholder="Ej: Serpost, EnvioTodo"
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nro. Guia / Tracking</label>
            <input value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Direccion destino</label>
            <input value={form.destAddress} onChange={(e) => setForm({ ...form, destAddress: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Distrito</label>
            <input value={form.destDistrict} onChange={(e) => setForm({ ...form, destDistrict: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input value={form.destCity} onChange={(e) => setForm({ ...form, destCity: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Peso (kg)</label>
            <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            {isDetail ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isDetail && (
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear Envio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
