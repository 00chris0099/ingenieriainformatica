'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Package, Clock, CheckCircle, Truck, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: 'text-yellow-500', label: 'Pendiente', icon: Clock },
  confirmed: { color: 'text-blue-500', label: 'Confirmado', icon: CheckCircle },
  processing: { color: 'text-purple-500', label: 'Procesando', icon: Package },
  shipped: { color: 'text-cyan-500', label: 'Enviado', icon: Truck },
  delivered: { color: 'text-green-500', label: 'Entregado', icon: CheckCircle },
  cancelled: { color: 'text-red-500', label: 'Cancelado', icon: Package },
};

export default function MisPedidosPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/v1/orders?limit=50')
        .then((res) => res.json())
        .then((data) => {
          setOrders(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
        <h1 className="text-3xl font-extrabold mb-8">Mis Pedidos</h1>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-green-500" />
          </div>
        )}

        {!loading && status === 'unauthenticated' && (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Inicia sesion para ver tus pedidos</p>
            <Link href="/login" className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors">
              Iniciar sesion
            </Link>
          </div>
        )}

        {!loading && status === 'authenticated' && orders.length === 0 && (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No tienes pedidos aun</p>
            <Link href="/tienda" className="mt-4 inline-block text-green-600 font-medium">Ir a la tienda</Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const st = statusConfig[order.status] || { color: 'text-gray-500', label: order.status, icon: Package };
              const Icon = st.icon;
              return (
                <Link key={order.id} href={`/pedido?n=${order.orderNumber}`}
                  className="block bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={20} className={st.color} />
                      <div>
                        <p className="font-semibold text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.items?.length || 0} items - {new Date(order.createdAt).toLocaleDateString('es-PE')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">S/ {order.total}</p>
                      <p className={`text-xs font-medium ${st.color}`}>{st.label}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
