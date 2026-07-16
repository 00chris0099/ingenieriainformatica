'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, BarChart3, ShoppingCart, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

type Tab = 'clv' | 'cohort' | 'seasonal' | 'cart';

export default function AnalyticsAvanzadoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('clv');

  const tabs = [
    { key: 'clv' as Tab, label: 'CLV', icon: Users },
    { key: 'cohort' as Tab, label: 'Cohortes', icon: BarChart3 },
    { key: 'seasonal' as Tab, label: 'Tendencias', icon: TrendingUp },
    { key: 'cart' as Tab, label: 'Carrito', icon: ShoppingCart },
  ];

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <PageHeader
        title="Analytics Avanzado"
        description="Metricas detalladas del negocio"
      />

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

      {activeTab === 'clv' && <CLVSection />}
      {activeTab === 'cohort' && <CohortSection />}
      {activeTab === 'seasonal' && <SeasonalSection />}
      {activeTab === 'cart' && <CartAnalysisSection />}
    </div>
  );
}

function CLVSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/advanced?type=clv')
      .then(res => res.json())
      .then(d => setData(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCLV = data.reduce((sum, c) => sum + (c.clv || 0), 0);
  const avgCLV = data.length > 0 ? totalCLV / data.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">CLV Promedio</div>
          <div className="text-2xl font-bold text-green-400">S/ {avgCLV.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">CLV Total</div>
          <div className="text-2xl font-bold text-blue-400">S/ {totalCLV.toFixed(2)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Clientes Analizados</div>
          <div className="text-2xl font-bold text-purple-400">{data.length}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Top Clientes por CLV</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos suficientes para calcular CLV</div>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 10).map((customer, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm text-white">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">S/ {(customer.clv || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{customer.orders || 0} pedidos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CohortSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/advanced?type=cohort')
      .then(res => res.json())
      .then(d => setData(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Analisis de Cohortes</h3>
        <p className="text-xs text-gray-500 mb-4">Retencion de clientes por mes de registro</p>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay suficientes datos para analisis de cohortes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400">Cohorte</th>
                  <th className="text-center py-2 px-3 text-gray-400">Clientes</th>
                  <th className="text-center py-2 px-3 text-gray-400">Mes 1</th>
                  <th className="text-center py-2 px-3 text-gray-400">Mes 2</th>
                  <th className="text-center py-2 px-3 text-gray-400">Mes 3</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 px-3 text-white">{row.month}</td>
                    <td className="py-2 px-3 text-center text-gray-300">{row.customers}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">{row.retention1 || 0}%</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">{row.retention2 || 0}%</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">{row.retention3 || 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SeasonalSection() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/advanced?type=seasonal')
      .then(res => res.json())
      .then(d => setData(d.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxSales = Math.max(...data.map(d => d.sales || 0), 1);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Tendencias Estacionales</h3>
        <p className="text-xs text-gray-500 mb-4">Ventas mensuales en los ultimos 12 meses</p>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de ventas suficientes</div>
        ) : (
          <div className="space-y-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16">{item.month}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                    style={{ width: `${((item.sales || 0) / maxSales) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-300 w-20 text-right">S/ {(item.sales || 0).toFixed(0)}</span>
                <span className="text-xs text-gray-500 w-12 text-right">{item.orders || 0} ped.</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Meses con Mayor Venta</h3>
        <div className="grid grid-cols-4 gap-3">
          {data.sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4).map((item, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-brand-400">{item.month}</div>
              <div className="text-xs text-gray-400">S/ {(item.sales || 0).toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CartAnalysisSection() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/advanced?type=cart')
      .then(res => res.json())
      .then(d => setData(d.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Tasa de Conversion</div>
          <div className="text-2xl font-bold text-green-400">{data.conversionRate || 0}%</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400">Valor Promedio Carrito</div>
          <div className="text-2xl font-bold text-blue-400">S/ {data.avgCartValue || 0}</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Productos Mas Abandonados</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-brand-400" /></div>
        ) : !data.abandonedProducts?.length ? (
          <div className="text-center py-8 text-gray-500 text-sm">No hay datos de carritos abandonados</div>
        ) : (
          <div className="space-y-2">
            {data.abandonedProducts.map((product: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6">#{i + 1}</span>
                  <p className="text-sm text-white">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-400">{product.abandoned} abandonos</p>
                  <p className="text-xs text-gray-500">S/ {product.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Funnel de Conversion</h3>
        <div className="space-y-3">
          {[
            { label: 'Visitas a tienda', value: data.visits || 0, pct: 100 },
            { label: 'Agregan al carrito', value: data.addToCart || 0, pct: data.visits ? ((data.addToCart || 0) / data.visits * 100) : 0 },
            { label: 'Inician checkout', value: data.checkout || 0, pct: data.visits ? ((data.checkout || 0) / data.visits * 100) : 0 },
            { label: 'Completan compra', value: data.purchased || 0, pct: data.visits ? ((data.purchased || 0) / data.visits * 100) : 0 },
          ].map((step, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">{step.label}</span>
                <span className="text-sm text-gray-400">{step.value} ({step.pct.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
