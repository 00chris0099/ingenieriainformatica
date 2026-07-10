'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Loader2, CheckCircle, Clock, Package, AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'picking', 'packing', 'ready_to_ship', 'shipped', 'in_transit', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
  picking: 'Picking', packing: 'Empaquetando', ready_to_ship: 'Listo para enviar',
  shipped: 'Enviado', in_transit: 'En transito', delivered: 'Entregado', cancelled: 'Cancelado',
};

export default function PedidoDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; nextStatus: string }>({ open: false, nextStatus: '' });

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (res.ok) { const data = await res.json(); setOrder(data.data); }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const advanceStatus = async (nextStatus: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchOrder();
    } catch (err) { console.error(err); }
    setUpdating(false);
  };

  const currentIdx = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-brand-400" /></div>;
  if (!order) return <div className="text-center py-20 text-gray-500">Pedido no encontrado</div>;

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"><ArrowLeft size={20} /></button>
        <div>
          <h2 className="text-xl font-bold text-white">{order.orderNumber}</h2>
          <p className="text-sm text-gray-400">Detalle del pedido</p>
        </div>
      </div>

      {/* Status + Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <StatusBadge status={order.status} label={STATUS_LABELS[order.status] || order.status} />
          <div className="flex gap-2">
            {nextStatus && (
              <button onClick={() => setConfirmDialog({ open: true, nextStatus })} disabled={updating}
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-brand-700 disabled:opacity-50">
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                Cambiar a: {STATUS_LABELS[nextStatus]}
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button onClick={() => setConfirmDialog({ open: true, nextStatus: 'cancelled' })} disabled={updating}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-medium hover:bg-red-500/30 disabled:opacity-50">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FLOW.map((s, i) => {
            const reached = currentIdx >= i;
            const current = order.status === s;
            return (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                  current ? 'bg-brand-600 text-white ring-2 ring-brand-600/30' : reached ? 'bg-brand-600/30 text-brand-400' : 'bg-gray-800 text-gray-500'
                }`}>{i + 1}</div>
                {i < STATUS_FLOW.length - 1 && <div className={`w-4 sm:w-8 h-0.5 ${reached ? 'bg-brand-600' : 'bg-gray-800'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Cliente</h3>
          <p className="text-sm text-white">{order.customer?.fullName || 'Sin cliente'}</p>
          <p className="text-xs text-gray-500">{order.customer?.email || ''}</p>
          <p className="text-xs text-gray-500">{order.customer?.phone || ''}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Pago</h3>
          <p className="text-lg font-bold text-brand-400">S/ {order.total}</p>
          <p className="text-xs text-gray-500">Estado: {order.paymentStatus}</p>
          <p className="text-xs text-gray-500">Moneda: {order.currency}</p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Items ({order.items?.length || 0})</h3>
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <Package size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-white">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.sku} x {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-brand-400">S/ {item.total}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 mt-3 pt-3 space-y-1">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">S/ {order.subtotal}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Envio</span><span className="text-white">S/ {order.shippingAmount}</span></div>
          <div className="flex justify-between text-base font-bold"><span className="text-white">Total</span><span className="text-brand-400">S/ {order.total}</span></div>
        </div>
      </div>

      {/* Timeline History */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Historial de Cambios</h3>
          <div className="space-y-3">
            {order.statusHistory.map((h: any) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-white">{STATUS_LABELS[h.fromStatus] || h.fromStatus || 'Inicio'} → {STATUS_LABELS[h.toStatus] || h.toStatus}</p>
                  <p className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString('es-PE')}</p>
                  {h.reason && <p className="text-xs text-gray-400 mt-0.5">Razon: {h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, nextStatus: '' })}
        onConfirm={() => { advanceStatus(confirmDialog.nextStatus); setConfirmDialog({ open: false, nextStatus: '' }); }}
        title={confirmDialog.nextStatus === 'cancelled' ? 'Cancelar Pedido' : 'Cambiar Estado'}
        message={confirmDialog.nextStatus === 'cancelled'
          ? 'Esta seguro de cancelar este pedido? Esta accion no se puede deshacer.'
          : `Cambiar estado a "${STATUS_LABELS[confirmDialog.nextStatus]}"?`}
        confirmLabel={confirmDialog.nextStatus === 'cancelled' ? 'Si, cancelar' : 'Confirmar'}
        variant={confirmDialog.nextStatus === 'cancelled' ? 'danger' : 'info'}
      />
    </div>
  );
}
