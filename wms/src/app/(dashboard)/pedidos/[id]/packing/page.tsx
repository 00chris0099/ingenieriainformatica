'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle, Package, Truck, Printer } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function PackingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});

  const fetchOrder = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.data);
        // Initialize verified items
        const initial: Record<string, boolean> = {};
        data.data.items?.forEach((item: any) => {
          initial[item.id] = false;
        });
        setVerifiedItems(initial);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const toggleItem = (itemId: string) => {
    setVerifiedItems({
      ...verifiedItems,
      [itemId]: !verifiedItems[itemId],
    });
  };

  const allVerified = order?.items?.every((item: any) => verifiedItems[item.id]);
  const verifiedCount = Object.values(verifiedItems).filter(Boolean).length;

  const handleComplete = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ready_to_ship' }),
      });
      router.push(`/pedidos?id=${orderId}`);
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

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">
        Pedido no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} />
        </button>
        <PageHeader
          title={`Packing - ${order.orderNumber}`}
          description={`${verifiedCount}/${order.items?.length || 0} items verificados`}
        />
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Verificacion de Empaque</span>
          <span className="text-sm font-medium text-brand-400">
            {Math.round((verifiedCount / (order.items?.length || 1)) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(verifiedCount / (order.items?.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Enviar a:</h3>
        <p className="text-sm text-white">{order.customer?.fullName}</p>
        <p className="text-xs text-gray-500">
          {typeof order.shippingAddress === 'object'
            ? `${order.shippingAddress.street || ''} ${order.shippingAddress.city || ''}`
            : order.shippingAddress || 'Sin direccion'}
        </p>
      </div>

      {/* Items to Verify */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Productos a Empaquetar</h3>
        <div className="space-y-2">
          {order.items?.map((item: any) => {
            const isVerified = verifiedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isVerified ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800 hover:bg-gray-750'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isVerified ? 'bg-green-500/20' : 'bg-gray-700'
                }`}>
                  {isVerified ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <Package size={16} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{item.sku}</p>
                </div>
                <span className="text-sm text-gray-400">x{item.quantity}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Acciones</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <Printer size={16} /> Imprimir Etiqueta de Envio
          </button>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            <Package size={16} /> Generar Guia de Remision
          </button>
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!allVerified || saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
        {allVerified ? 'Marcar como Listo para Envio' : `Faltan ${(order.items?.length || 0) - verifiedCount} items por verificar`}
      </button>
    </div>
  );
}
