'use client';

import { BarChart3, Download, Loader2, Receipt, Truck, DollarSign, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ReportTab = 'general' | 'igv' | 'suppliers' | 'margins' | 'inventory';

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('general');

  const tabs = [
    { key: 'general' as ReportTab, label: 'General', icon: BarChart3 },
    { key: 'igv' as ReportTab, label: 'IGV', icon: Receipt },
    { key: 'suppliers' as ReportTab, label: 'Proveedores', icon: Truck },
    { key: 'margins' as ReportTab, label: 'Margenes', icon: DollarSign },
    { key: 'inventory' as ReportTab, label: 'Inventario', icon: Package },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Reportes</h2>
          <p className="text-sm text-gray-400">Metricas y exportacion de datos</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
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

      {activeTab === 'general' && <GeneralReport />}
      {activeTab === 'igv' && <IGVReport />}
      {activeTab === 'suppliers' && <SuppliersReport />}
      {activeTab === 'margins' && <MarginsReport />}
      {activeTab === 'inventory' && <InventoryReport />}
    </div>
  );
}

function GeneralReport() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    fetch(`/api/v1/dashboard/stats?period=${period}`)
      .then(res => res.json())
      .then(d => setStats(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const handleExport = async (type: string) => {
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
  };

  const chartData = [
    { name: 'Prod', value: stats?.totalProducts || 0 },
    { name: 'Pedidos', value: stats?.totalOrders || 0 },
    { name: 'Clientes', value: stats?.totalCustomers || 0 },
    { name: 'Stock Bajo', value: stats?.lowStockProducts || 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handleExport('products')} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
          <Download size={14} /> Productos
        </button>
        <button onClick={() => handleExport('orders')} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
          <Download size={14} /> Pedidos
        </button>
        <button onClick={() => handleExport('customers')} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-700">
          <Download size={14} /> Clientes
        </button>
      </div>

      <div className="flex gap-2">
        {[{ key: 'today', label: 'Hoy' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }].map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${period === p.key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-brand-400" /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Productos</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalProducts}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Pedidos</p>
              <p className="text-xl font-bold text-white mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Stock Bajo</p>
              <p className="text-xl font-bold text-red-400 mt-1">{stats.lowStockProducts}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-green-400 mt-1">S/ {stats.totalRevenue?.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
      ) : null}
    </div>
  );
}

function IGVReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/igv')
      .then(res => res.json())
      .then(d => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">IGV Cobrado (Mes)</div>
          <div className="text-2xl font-bold text-green-400">S/ {data?.igvThisMonth || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">IGV Cobrado (Año)</div>
          <div className="text-2xl font-bold text-blue-400">S/ {data?.igvThisYear || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Total Ventas Gravadas</div>
          <div className="text-2xl font-bold text-purple-400">S/ {data?.totalTaxable || 0}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Desglose por Mes</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : !data?.monthly?.length ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de IGV</div>
        ) : (
          <div className="space-y-2">
            {data.monthly.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-sm text-white">{item.month}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-gray-400">Base: S/ {item.base}</span>
                  <span className="text-yellow-400">IGV: S/ {item.igv}</span>
                  <span className="text-green-400 font-medium">Total: S/ {item.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuppliersReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/suppliers')
      .then(res => res.json())
      .then(d => setData(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Compras por Proveedor</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de compras</div>
        ) : (
          <div className="space-y-2">
            {data.map((supplier, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm text-white">{supplier.name}</p>
                    <p className="text-xs text-gray-500">{supplier.orders || 0} ordenes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">S/ {(supplier.totalSpent || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{supplier.avgDelivery || 0} dias promedio</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MarginsReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/margins')
      .then(res => res.json())
      .then(d => setData(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.reduce((sum, p) => sum + (p.revenue || 0), 0);
  const totalCost = data.reduce((sum, p) => sum + (p.cost || 0), 0);
  const totalMargin = totalRevenue - totalCost;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Revenue Total</div>
          <div className="text-2xl font-bold text-green-400">S/ {totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Costo Total</div>
          <div className="text-2xl font-bold text-red-400">S/ {totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Margen Bruto</div>
          <div className="text-2xl font-bold text-blue-400">S/ {totalMargin.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Top 10 Productos Mas Rentables</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de margenes</div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((product, i) => {
              const marginPct = product.revenue > 0 ? ((product.margin || 0) / product.revenue * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                    <div>
                      <p className="text-sm text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">S/ {(product.margin || 0).toFixed(2)}</p>
                    <p className={`text-xs ${marginPct >= 30 ? 'text-green-400' : marginPct >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {marginPct.toFixed(1)}% margen
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/reports/inventory')
      .then(res => res.json())
      .then(d => setData(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Valor Total Stock</div>
          <div className="text-2xl font-bold text-green-400">S/ {data?.totalValue || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Rotacion Promedio</div>
          <div className="text-2xl font-bold text-blue-400">{data?.avgTurnover || 0} dias</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Sin Movimiento {'>'} 90 dias</div>
          <div className="text-2xl font-bold text-red-400">{data?.obsoleteCount || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Total Unidades</div>
          <div className="text-2xl font-bold text-purple-400">{data?.totalUnits || 0}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Stock por Categoria</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : !data?.byCategory?.length ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de inventario</div>
        ) : (
          <div className="space-y-2">
            {data.byCategory.map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-white">{cat.name}</p>
                  <p className="text-xs text-gray-500">{cat.products} productos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-brand-400">{cat.units} unidades</p>
                  <p className="text-xs text-gray-500">S/ {cat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Productos Obsoletos (sin movimiento {'>'} 90 dias)</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : !data?.obsoleteProducts?.length ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay productos obsoletos</div>
        ) : (
          <div className="space-y-2">
            {data.obsoleteProducts.slice(0, 10).map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-white">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sku} | {product.daysSinceLastSale} dias sin venta</p>
                </div>
                <span className="text-sm text-red-400">{product.stock} unidades</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
