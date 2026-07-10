'use client';

import { BarChart3, Download, Loader2, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportesPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/dashboard/stats?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [period]);

  const handleExport = async (type: string) => {
    try {
      const res = await fetch(`/api/v1/reports/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adriskids-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Mock chart data for visual representation
  const chartData = [
    { name: 'Prod', value: stats?.totalProducts || 0 },
    { name: 'Pedidos', value: stats?.totalOrders || 0 },
    { name: 'Clientes', value: stats?.totalCustomers || 0 },
    { name: 'Stock Bajo', value: stats?.lowStockProducts || 0 },
  ];

  // RF-24: Calculate conversion rate (orders / visitors)
  // Using orders as proxy for completed purchases
  const conversionRate = stats?.totalOrders && stats?.totalCustomers
    ? ((stats.totalOrders / Math.max(stats.totalCustomers, 1)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Reportes / Analytics</h2>
          <p className="text-sm text-gray-400">Resumen del negocio</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handleExport('products')}
            className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
            <Download size={14} /> Productos
          </button>
          <button onClick={() => handleExport('orders')}
            className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
            <Download size={14} /> Pedidos
          </button>
          <button onClick={() => handleExport('inventory')}
            className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
            <Download size={14} /> Inventario
          </button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Semana' },
          { key: 'month', label: 'Mes' },
        ].map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              period === p.key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{p.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : stats ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Productos</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalProducts}</p>
              <p className="text-xs text-green-400 mt-1">{stats.activeProducts} activos</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Pedidos</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalOrders}</p>
              <p className="text-xs text-yellow-400 mt-1">{stats.pendingOrders} pendientes</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Stock Bajo</p>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.lowStockProducts}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-green-400 mt-1">S/ {stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* RF-24: Conversion Rate */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Tasa de Conversion (RF-24)</p>
                <p className="text-2xl font-bold text-brand-400 mt-1">{conversionRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Pedidos / Clientes registrados</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">{stats.totalOrders} pedidos</p>
                <p className="text-sm text-gray-400">{stats.totalCustomers} clientes</p>
              </div>
            </div>
          </div>

          {/* RF-26: Top Products by Units Sold */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Top Productos por Unidades Vendidas (RF-26)</h3>
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-2">
                {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-brand-400">{Number(product.total_quantity)} unidades</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay datos de ventas aun</p>
            )}
          </div>

          {/* Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Resumen Visual</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500"><BarChart3 size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No hay datos disponibles</p></div>
      )}
    </div>
  );
}
