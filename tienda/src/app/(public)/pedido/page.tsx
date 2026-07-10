'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: 'text-yellow-500', label: 'Pendiente', icon: Clock },
  confirmed: { color: 'text-blue-500', label: 'Confirmado', icon: CheckCircle },
  processing: { color: 'text-purple-500', label: 'Procesando', icon: Package },
  shipped: { color: 'text-cyan-500', label: 'Enviado', icon: Truck },
  delivered: { color: 'text-green-500', label: 'Entregado', icon: CheckCircle },
  cancelled: { color: 'text-red-500', label: 'Cancelado', icon: null },
};

function PedidoContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('n');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(orderNumber || '');
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/orders?order_number=${num}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) setOrder(data.data);
        else setError('Pedido no encontrado');
      } else {
        setError('Pedido no encontrado');
      }
    } catch { setError('Error al buscar pedido'); }
    setLoading(false);
  }, []);

  useEffect(() => { if (orderNumber) fetchOrder(orderNumber); }, [orderNumber, fetchOrder]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-extrabold mb-2">Seguimiento de Pedido</h1>
        <p className="text-gray-500 mb-8">Ingresa tu numero de pedido para ver el estado</p>

        <div className="flex gap-3 mb-8">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ADR-20260703-00001"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300" />
          <button onClick={() => fetchOrder(search)} disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {order && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{order.orderNumber}</h2>
                <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-PE')}</p>
              </div>
              <span className={`text-sm font-medium ${statusConfig[order.status]?.color || 'text-gray-500'}`}>
                {statusConfig[order.status]?.label || order.status}
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-4 mb-6">
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((s, i) => {
                const reached = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= i;
                const st = statusConfig[s];
                const Icon = st?.icon || Clock;
                return (
                  <div key={s} className={`flex items-center gap-3 ${reached ? 'opacity-100' : 'opacity-30'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reached ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${reached ? 'text-gray-900' : 'text-gray-400'}`}>{st?.label}</p>
                      <p className="text-xs text-gray-400">{i === 0 ? 'Tu pedido fue recibido' : `Paso ${i + 1}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500">Total: <span className="font-bold text-gray-900">S/ {order.total}</span></p>
              <p className="text-sm text-gray-500">Items: {order.items?.length || 0} productos</p>
            </div>

            <Link href="/tienda" className="mt-6 inline-block text-green-600 font-medium text-sm hover:text-green-700">
              Seguir comprando →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function PedidoTrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-green-500" /></div>
        <Footer />
      </div>
    }>
      <PedidoContent />
    </Suspense>
  );
}
