'use client';

import { ShoppingCart, Search, Eye, Loader2, Plus, CheckCircle, X, Phone, MessageCircle, Package } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

const statusConfig: Record<string, { color: string; label: string }> = {
  confirmed: { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmado' },
  dispatched: { color: 'bg-green-500/20 text-green-400', label: 'Despachado' },
  cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelado' },
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('q', search);
      const res = await fetch(`/api/v1/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (previewOrder?.id === orderId) {
          setPreviewOrder({ ...previewOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
    setUpdatingId(null);
  };

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'dispatched', label: 'Despachados' },
  ];

  const stats = {
    total: orders.length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
  };

  const getPhone = (order: any) => order.customerPhone || order.phone || '';
  const getWhatsAppUrl = (order: any) => {
    const phone = getPhone(order).replace(/[^0-9]/g, '');
    if (!phone) return null;
    const phoneWithCountryCode = phone.startsWith('51') ? phone : `51${phone}`;
    return `https://wa.me/${phoneWithCountryCode}`;
  };
  const getCallUrl = (order: any) => {
    const phone = getPhone(order).replace(/[^0-9]/g, '');
    if (!phone) return null;
    const phoneWithCountryCode = phone.startsWith('51') ? phone : `51${phone}`;
    return `tel:+${phoneWithCountryCode}`;
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Pedidos"
        description={`${stats.total} pedidos - ${stats.confirmed} confirmados, ${stats.dispatched} despachados`}
        actions={
          <Link
            href="/pedidos/nuevo"
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={18} /> Nuevo Pedido
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.confirmed}</p>
          <p className="text-[10px] text-gray-500">Confirmados</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.dispatched}</p>
          <p className="text-[10px] text-gray-500">Despachados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por numero o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No hay pedidos"
          description="Los pedidos apareceran cuando se creen desde la tienda"
          action={
            <Link
              href="/pedidos/nuevo"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700"
            >
              <Plus size={16} /> Crear Primer Pedido
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = statusConfig[order.status] || { color: 'bg-gray-500/20 text-gray-400', label: order.status };
            return (
              <div
                key={order.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewOrder(order)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{order.orderNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{order.customer}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{order.itemsCount} items</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand-400">S/ {order.total}</p>
                    </div>
                    {/* Quick WhatsApp button */}
                    {getWhatsAppUrl(order) && (
                      <a
                        href={getWhatsAppUrl(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => setPreviewOrder(order)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={16} />
                    </button>
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'dispatched')}
                        disabled={updatingId === order.id}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Marcar como despachado"
                      >
                        {updatingId === order.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewOrder(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="font-semibold text-white">{previewOrder.orderNumber}</h3>
                <p className="text-xs text-gray-500">{new Date(previewOrder.createdAt).toLocaleString('es-PE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig[previewOrder.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                  {statusConfig[previewOrder.status]?.label || previewOrder.status}
                </span>
                <button onClick={() => setPreviewOrder(null)} className="p-1 hover:bg-gray-800 rounded-lg">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Contact buttons */}
              <div className="flex gap-3">
                {getWhatsAppUrl(previewOrder) && (
                  <a
                    href={getWhatsAppUrl(previewOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                )}
                {getCallUrl(previewOrder) && (
                  <a
                    href={getCallUrl(previewOrder)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Phone size={18} /> Llamar
                  </a>
                )}
              </div>

              {/* Customer info */}
              <div className="bg-gray-800/50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="text-sm text-white font-medium">{previewOrder.customer}</p>
                {previewOrder.customerEmail && <p className="text-xs text-gray-400 mt-0.5">{previewOrder.customerEmail}</p>}
                {getPhone(previewOrder) && <p className="text-xs text-gray-400 mt-0.5">{getPhone(previewOrder)}</p>}
              </div>

              {/* Shipping address */}
              {previewOrder.shippingAddress && (
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Direccion de envio</p>
                  <p className="text-sm text-white">
                    {typeof previewOrder.shippingAddress === 'string'
                      ? previewOrder.shippingAddress
                      : `${previewOrder.shippingAddress.department || ''} - ${previewOrder.shippingAddress.province || ''} - ${previewOrder.shippingAddress.district || ''}`}
                  </p>
                  {previewOrder.shippingAddress.address && <p className="text-xs text-gray-400 mt-0.5">{previewOrder.shippingAddress.address}</p>}
                  {previewOrder.shippingAddress.reference && <p className="text-xs text-gray-500 mt-0.5">Ref: {previewOrder.shippingAddress.reference}</p>}
                </div>
              )}

              {/* Order items */}
              {previewOrder.items && previewOrder.items.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2">Productos</p>
                  <div className="space-y-2">
                    {previewOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-gray-500 shrink-0" />
                          <span className="text-gray-300">{item.name || item.productName || 'Producto'}</span>
                          <span className="text-gray-500 text-xs">x{item.quantity}</span>
                        </div>
                        <span className="text-white font-medium">S/ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">S/ {previewOrder.subtotal || previewOrder.total}</span>
                </div>
                {previewOrder.shippingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Envio</span>
                    <span className="text-white">S/ {previewOrder.shippingAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t border-gray-700 mt-2 pt-2">
                  <span className="text-white">Total</span>
                  <span className="text-brand-400">S/ {previewOrder.total}</span>
                </div>
              </div>

              {/* Status actions */}
              <div className="flex gap-3">
                {previewOrder.status === 'confirmed' && (
                  <button
                    onClick={() => { handleUpdateStatus(previewOrder.id, 'dispatched'); setPreviewOrder(null); }}
                    disabled={updatingId === previewOrder.id}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updatingId === previewOrder.id ? (
                      <><Loader2 size={16} className="animate-spin" /> Actualizando...</>
                    ) : (
                      <><CheckCircle size={16} /> Despachar Pedido</>
                    )}
                  </button>
                )}
                {previewOrder.status !== 'cancelled' && previewOrder.status !== 'dispatched' && (
                  <button
                    onClick={() => { handleUpdateStatus(previewOrder.id, 'cancelled'); setPreviewOrder(null); }}
                    disabled={updatingId === previewOrder.id}
                    className="px-4 py-3 bg-red-600/20 text-red-400 rounded-xl font-semibold hover:bg-red-600/30 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
