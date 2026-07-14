'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ShoppingCart, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReportesPage from '../reportes/page';

type Tab = 'resumen' | 'reportes';

const tabs = [
  { key: 'resumen' as Tab, label: 'Resumen', icon: DollarSign },
  { key: 'reportes' as Tab, label: 'Reportes', icon: BarChart3 },
];

interface FinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  averageTicket: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export default function FinanzasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancials() {
      try {
        const res = await fetch('/api/v1/orders?limit=500');
        if (res.ok) {
          const result = await res.json();
          const orders = result.data || [];

          const paidOrders = orders.filter((o: any) => o.paymentStatus === 'paid');
          const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
          const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

          // Group by month
          const monthlyMap: Record<string, number> = {};
          paidOrders.forEach((o: any) => {
            const date = new Date(o.createdAt);
            const month = date.toLocaleString('es-PE', { month: 'short', year: '2-digit' });
            monthlyMap[month] = (monthlyMap[month] || 0) + (o.total || 0);
          });

          const monthlyRevenue = Object.entries(monthlyMap)
            .map(([month, revenue]) => ({ month, revenue }))
            .slice(-6);

          setData({
            totalRevenue,
            totalOrders: orders.length,
            paidOrders: paidOrders.length,
            averageTicket,
            monthlyRevenue,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFinancials();
  }, []);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div>
        <h2 className="text-xl font-bold text-white">Finanzas</h2>
        <p className="text-sm text-gray-400">Resumen financiero</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumen' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <DollarSign size={16} />
                    <span>Ingresos Totales</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">S/ {data.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Precios finales</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <ShoppingCart size={16} />
                    <span>Pedidos Pagados</span>
                  </div>
                  <p className="text-2xl font-bold text-brand-400">{data.paidOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">de {data.totalOrders} totales</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <TrendingUp size={16} />
                    <span>Ticket Promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">S/ {data.averageTicket.toFixed(0)}</p>
                  <p className="text-xs text-gray-500 mt-1">Por pedido pagado</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <BarChart3 size={16} />
                    <span>Meses con Ventas</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{data.monthlyRevenue.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Historial disponible</p>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              {data.monthlyRevenue.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">Ventas por Mes</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value: number) => [`S/ ${value.toLocaleString()}`, 'Ingresos']}
                        />
                        <Bar dataKey="revenue" fill="#22c55e" name="Ingresos" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {data.monthlyRevenue.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <DollarSign size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No hay ventas pagadas registradas</p>
                  <p className="text-xs text-gray-500 mt-1">Los ingresos apareceran cuando se paguen pedidos</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">No se pudieron cargar los datos</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'reportes' && <ReportesPage />}
    </div>
  );
}
