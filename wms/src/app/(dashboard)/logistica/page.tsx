'use client';

import { Truck, Package, MapPin, Clock, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
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

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Logistica / Envios</h2>
          <p className="text-sm text-gray-400">{shipments.length} envios</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700">
          <Package size={18} /> Nuevo Envio
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
                      <div className="flex items-center gap-1 mt-2 text-xs text-brand-400">
                        <ExternalLink size={12} /> {ship.trackingNumber}
                      </div>
                    )}
                  </div>
                  {ship.createdAt && <p className="text-xs text-gray-500 shrink-0">{new Date(ship.createdAt).toLocaleDateString('es-PE')}</p>}
                </div>
              </div>
            );
          })}
          {shipments.length === 0 && (
            <div className="text-center py-12 text-gray-500"><Truck size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay envios</p></div>
          )}
        </div>
      )}
    </div>
  );
}
