'use client';

import { ShoppingCart, Search, Eye, Loader2, Plus, Package } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendiente' },
  confirmed: { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmado' },
  processing: { color: 'bg-purple-500/20 text-purple-400', label: 'Procesando' },
  picking: { color: 'bg-indigo-500/20 text-indigo-400', label: 'Picking' },
  packing: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Empaquetando' },
  ready_to_ship: { color: 'bg-teal-500/20 text-teal-400', label: 'Listo para enviar' },
  shipped: { color: 'bg-blue-500/20 text-blue-400', label: 'Enviado' },
  in_transit: { color: 'bg-orange-500/20 text-orange-400', label: 'En transito' },
  delivered: { color: 'bg-green-500/20 text-green-400', label: 'Entregado' },
  cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelado' },
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'processing', label: 'Procesando' },
    { key: 'picking', label: 'Picking' },
    { key: 'packing', label: 'Empaquetando' },
    { key: 'shipped', label: 'Enviados' },
    { key: 'delivered', label: 'Entregados' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => ['confirmed', 'processing', 'picking', 'packing'].includes(o.status)).length,
    shipped: orders.filter(o => ['shipped', 'in_transit'].includes(o.status)).length,
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Pedidos"
        description={`${stats.total} pedidos - ${stats.pending} pendientes, ${stats.processing} en proceso`}
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
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-[10px] text-gray-500">Pendientes</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.processing}</p>
          <p className="text-[10px] text-gray-500">En Proceso</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.shipped}</p>
          <p className="text-[10px] text-gray-500">Enviados</p>
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
          description="Los pedidos apareceran aqui cuando se creen desde la tienda o manualmente"
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
              <Link
                key={order.id}
                href={`/pedidos?id=${order.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{order.orderNumber}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {order.source}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{order.customer}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{order.itemsCount} items</span>
                      <span>{new Date(order.createdAt).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-lg font-bold text-brand-400">S/ {order.total}</p>
                    <Eye size={14} className="text-gray-500 mt-1 ml-auto" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
