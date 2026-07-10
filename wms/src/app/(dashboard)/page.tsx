'use client';

import { TrendingUp, ShoppingCart, AlertTriangle, Users, Clock, Package, ArrowRight, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

const PIE_COLORS = ['#eab308', '#3b82f6', '#a855f7', '#06b6d4', '#22c55e', '#ef4444'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats?period=month'),
          fetch('/api/v1/orders?limit=10'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.data || []);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    processing: 'bg-purple-500/20 text-purple-400',
    shipped: 'bg-cyan-500/20 text-cyan-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  // Group orders by status for pie chart
  const ordersByStatus = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }));

  // Simple bar chart data (last 7 orders by total)
  const barData = orders.slice(0, 7).map((o) => ({
    name: o.orderNumber.slice(-8),
    total: Number(o.total),
  }));

  const statCards = [
    { label: 'Productos', sub: `${stats?.activeProducts || 0} activos`, value: stats?.totalProducts?.toString() || '0', icon: Package, color: 'text-blue-400', href: '/catalogo' },
    { label: 'Pedidos', sub: `${stats?.pendingOrders || 0} pendientes`, value: stats?.totalOrders?.toString() || '0', icon: ShoppingCart, color: 'text-yellow-400', href: '/pedidos' },
    { label: 'Stock Bajo', sub: 'Requiere atencion', value: stats?.lowStockProducts?.toString() || '0', icon: AlertTriangle, color: 'text-red-400', href: '/inventario' },
    { label: 'Clientes', sub: 'Total registrados', value: stats?.totalCustomers?.toString() || '0', icon: Users, color: 'text-green-400', href: '/clientes' },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-gray-400">Resumen de tu negocio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{stat.label}</span>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{loading ? '-' : stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Revenue */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Revenue del Mes</p>
            <p className="text-2xl font-bold text-green-400 mt-1">S/ {stats?.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
          <DollarSign size={24} className="text-green-400/50" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart - Orders by value */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Pedidos por Valor</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="total" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              {loading ? 'Cargando...' : 'Sin datos'}
            </div>
          )}
        </div>

        {/* Pie Chart - Orders by status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Pedidos por Estado</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              {loading ? 'Cargando...' : 'Sin datos'}
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {entry.name} ({entry.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Accesos Rapidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href="/catalogo" className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <Package size={16} /> Nuevo Producto
          </Link>
          <Link href="/pedidos" className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <ShoppingCart size={16} /> Ver Pedidos
          </Link>
          <Link href="/inventario" className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <AlertTriangle size={16} /> Revisar Stock
          </Link>
          <Link href="/reportes" className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <TrendingUp size={16} /> Ver Reportes
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-300">Pedidos Recientes</h3>
          <Link href="/pedidos" className="text-xs text-brand-400 hover:text-brand-300">Ver todos</Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            {loading ? 'Cargando...' : 'No hay pedidos aun'}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orders.map((order) => (
              <Link key={order.id} href={`/pedidos?id=${order.id}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock size={14} className="text-gray-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 truncate">{order.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-brand-400">S/ {order.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
