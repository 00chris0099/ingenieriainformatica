'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, Loader2, User, MapPin, CreditCard } from 'lucide-react';

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pendiente', icon: Clock },
  confirmed: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Confirmado', icon: CheckCircle },
  processing: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Preparando', icon: Package },
  shipped: { color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Enviado', icon: Truck },
  in_transit: { color: 'text-teal-600', bg: 'bg-teal-100', label: 'En transito', icon: Truck },
  delivered: { color: 'text-green-600', bg: 'bg-green-100', label: 'Entregado', icon: CheckCircle },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelado', icon: null },
};

const timelineSteps = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];

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

  const historyMap: Record<string, string> = {};
  (order?.statusHistory || []).forEach((h: any) => {
    historyMap[h.toStatus] = h.createdAt;
  });

  const shipping = order?.shippingAddress as any || {};

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-extrabold mb-2">Seguimiento de Pedido</h1>
        <p className="text-gray-500 mb-8">Ingresa tu numero de pedido para ver el estado y detalles</p>

        <div className="flex gap-3 mb-8">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ADR-20260703-00001"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300" />
          <button onClick={() => fetchOrder(search)} disabled={loading}
            className="bg-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-50">
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Buscar'}
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {order && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusConfig[order.status]?.bg || 'bg-gray-100'} ${statusConfig[order.status]?.color || 'text-gray-500'}`}>
                  {statusConfig[order.status]?.label || order.status}
                </span>
              </div>

              {/* Timeline */}
              <div className="space-y-3 mt-6">
                {timelineSteps.map((s, i) => {
                  const reached = timelineSteps.indexOf(order.status) >= i;
                  const st = statusConfig[s];
                  const Icon = st?.icon || Clock;
                  const histDate = historyMap[s];
                  return (
                    <div key={s} className={`flex items-center gap-3 ${reached ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${reached ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${reached ? 'text-gray-900' : 'text-gray-400'}`}>{st?.label}</p>
                        <p className="text-xs text-gray-400">
                          {histDate ? new Date(histDate).toLocaleString('es-PE') : (i === 0 ? 'Tu pedido fue recibido' : `Paso ${i + 1}`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Contact */}
            {order.customer && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <User size={16} className="text-pink-500" /> Datos del cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Nombre</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.fullName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Telefono</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.email || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {shipping.address && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <MapPin size={16} className="text-pink-500" /> Direccion de envio
                </h3>
                <p className="text-sm font-medium text-gray-900">{shipping.address}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {[shipping.district, shipping.province, shipping.department].filter(Boolean).join(', ')}
                </p>
                {shipping.reference && (
                  <p className="text-xs text-gray-500 mt-1">Ref: {shipping.reference}</p>
                )}
              </div>
            )}

            {/* Payment */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <CreditCard size={16} className="text-pink-500" /> Metodo de pago
              </h3>
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-gray-900">
                  {order.paymentMethod === 'contraentrega' ? 'Contraentrega' : order.paymentMethod === 'mercadopago' ? 'MercadoPago' : order.paymentMethod || '—'}
                </p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'pending' ? 'Pendiente' : order.paymentStatus || '—'}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <Package size={16} className="text-pink-500" /> Productos
              </h3>
              <div className="space-y-3">
                {(order.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500">Cant: {item.quantity} x S/ {Number(item.unitPrice).toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-4">S/ {Number(item.total).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>S/ {Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>-S/ {Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Envio</span>
                  <span>{order.shippingAmount === 0 ? <span className="text-green-600 font-medium">Gratis</span> : `S/ ${Number(order.shippingAmount || 0).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-pink-600">S/ {Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Link */}
            <div className="text-center">
              <Link href="/tienda" className="text-pink-500 font-medium text-sm hover:text-pink-600">
                Seguir comprando →
              </Link>
            </div>
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
        <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-pink-500" /></div>
        <Footer />
      </div>
    }>
      <PedidoContent />
    </Suspense>
  );
}
