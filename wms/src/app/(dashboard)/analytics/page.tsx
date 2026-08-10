'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Eye, Users, ShoppingCart, CheckCircle2, DollarSign, RefreshCw, Filter } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'

const SOURCE_COLORS: Record<string, string> = {
  direct: '#64748b',
  google: '#4285f4',
  facebook: '#1877f2',
  instagram: '#e1306c',
  whatsapp: '#25d366',
  youtube: '#ff0000',
  tiktok: '#010101',
  twitter: '#1d9bf0',
  other: '#94a3b8',
}

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981']

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [businessId, setBusinessId] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [external, setExternal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/businesses')
      if (res.ok) {
        const json = await res.json()
        setBusinesses(Array.isArray(json.data) ? json.data : [])
      }
    } catch {}
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('days', String(days))
      if (businessId) params.set('businessId', businessId)
      const [funnelRes, extRes] = await Promise.all([
        fetch(`/api/v1/analytics/funnel?${params}`),
        fetch(`/api/v1/analytics/external?${params}`),
      ])
      if (funnelRes.ok) {
        const json = await funnelRes.json()
        setData(json.data)
      }
      if (extRes.ok) {
        const json = await extRes.json()
        setExternal(json.data)
      }
    } catch (e) {
      console.error('[ANALYTICS]', e)
    } finally {
      setLoading(false)
    }
  }, [days, businessId])

  useEffect(() => { fetchBusinesses(); fetchData() }, [fetchData, fetchBusinesses])

  const funnel = data?.funnel || {}
  const sources = data?.sources || []
  const daily = data?.daily || []
  const topPages = data?.topPages || []
  const topProducts = data?.topProducts || []
  const utm = data?.utm || []

  const funnelData = [
    { name: 'Vistas', value: funnel.views || 0 },
    { name: 'Leads', value: funnel.leads || 0 },
    { name: 'Pedidos', value: funnel.orders || 0 },
    { name: 'Pagados', value: funnel.paidOrders || 0 },
  ]

  const pieData = sources.map((s: any) => ({ name: s.source, value: s.views }))

  const extCfg = external?.configured || {}
  const extData = external?.data

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
            Analytics & Embudo de Conversión
          </h2>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Vista → Lead → Pedido → Pagado. Rastrea vistas reales de tus páginas públicas, origen del tráfico y qué convierte.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {businesses.length > 1 && (
            <div className="w-52">
              <Select value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value="">Todas mis tiendas</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          )}
          <div className="flex items-center gap-1 border border-[var(--color-border)] rounded-xl p-1">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${days === d ? 'text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'}`}
                style={days === d ? { backgroundColor: 'var(--color-accent)' } : {}}
              >{d}d</button>
            ))}
          </div>
          <button onClick={() => fetchData()}
            className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-all"
            title="Actualizar"><RefreshCw size={14} /></button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          <div className="col-span-4"><Skeleton className="h-72 rounded-xl" /></div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Kpi icon={<Eye size={16} />} label="Vistas" value={funnel.views || 0} color="#6366f1" />
            <Kpi icon={<Users size={16} />} label="Leads" value={funnel.leads || 0} color="#8b5cf6" />
            <Kpi icon={<ShoppingCart size={16} />} label="Pedidos" value={funnel.orders || 0} color="#f59e0b" />
            <Kpi icon={<CheckCircle2 size={16} />} label="Pagados" value={funnel.paidOrders || 0} color="#10b981" />
            <Kpi icon={<DollarSign size={16} />} label="Ingresos" value={new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(data?.revenue || 0)} color="#0ea5e9" />
            <div className="surface-card p-4 rounded-2xl space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)]">Conversión</p>
              <p className="text-lg font-black" style={{ color: 'var(--color-accent)' }}>
                {funnel.rates?.viewToLead ?? 0}%
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">vista → lead · {funnel.rates?.viewToPaid ?? 0}% → pago</p>
            </div>
          </div>

          {/* Funnel + Source donut */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="surface-card p-5 rounded-2xl xl:col-span-2">
              <h3 className="text-sm font-bold mb-1">Embudo de Conversión</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">Vistas de página → leads capturados → pedidos → pagados (últimos {days} días)</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" name="Cantidad" radius={[0, 8, 8, 0]}>
                      {funnelData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {[
                  { label: 'Vista → Lead', value: `${funnel.rates?.viewToLead ?? 0}%` },
                  { label: 'Lead → Pedido', value: `${funnel.rates?.leadToOrder ?? 0}%` },
                  { label: 'Vista → Pagado', value: `${funnel.rates?.viewToPaid ?? 0}%` },
                  { label: 'Pedidos pagados', value: `${funnel.paidOrders || 0}/${funnel.orders || 0}` },
                ].map((r) => (
                  <div key={r.label} className="bg-[var(--color-bg-base)] rounded-xl px-3 py-2">
                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold">{r.label}</p>
                    <p className="text-sm font-black" style={{ color: 'var(--color-accent)' }}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-5 rounded-2xl">
              <h3 className="text-sm font-bold mb-1">Origen del Tráfico</h3>
              <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">De dónde vienen tus visitas (referrer / UTM)</p>
              {pieData.length === 0 ? (
                <p className="text-center text-xs text-[var(--color-text-tertiary)] py-16">Aún no hay vistas registradas.</p>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                          {pieData.map((s: any, i: number) => (
                            <Cell key={i} fill={SOURCE_COLORS[s.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {sources.slice(0, 6).map((s: any) => (
                      <div key={s.source} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[s.source] || '#94a3b8' }} />
                        <span className="font-bold capitalize flex-1">{s.source}</span>
                        <span className="text-[var(--color-text-tertiary)]">{s.views}</span>
                      </div>
                    ))}
                  </div>
                  {utm.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1.5">Campañas UTM</p>
                      {utm.slice(0, 4).map((u: any, i: number) => (
                        <p key={i} className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                          <span className="font-bold text-[var(--color-text-secondary)]">{u.source}</span>
                          {u.campaign ? ` · ${u.campaign}` : ''} — {u.views}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* External sources (GA4 / Plausible) */}
          <div className="surface-card p-5 rounded-2xl">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <h3 className="text-sm font-bold">Fuentes externas (GA4 / Plausible)</h3>
              <div className="flex items-center gap-2">
                <Badge variant={extCfg.ga4 ? 'success' : 'neutral'}>GA4 {extCfg.ga4 ? '· conectado' : '· sin configurar'}</Badge>
                <Badge variant={extData ? 'success' : 'neutral'}>
                  Plausible {extData ? `· ${extCfg.plausibleDomain}` : extCfg.plausible ? '· sin API key' : '· sin configurar'}
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
              Configura los IDs en <span className="font-bold">Pagos & Cobros → Analítica externa</span>. GA4 recolecta con gtag.js; Plausible suma sus métricas aquí.
            </p>
            {external?.error ? (
              <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 rounded-xl px-3 py-2">Plausible: {external.error}</p>
            ) : extData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--color-bg-base)] rounded-xl p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)]">Plausible · {extData.visitors} visitantes</p>
                  <div className="flex items-end gap-4 mt-2">
                    <div>
                      <p className="text-xl font-black" style={{ color: 'var(--color-accent)' }}>{extData.pageviews}</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">pageviews</p>
                    </div>
                    <div>
                      <p className="text-xl font-black">{extData.bounceRate}%</p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">rebote</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
                    vs {funnel.views || 0} vistas propias (embudo interno)
                  </p>
                </div>
                <div className="md:col-span-2 bg-[var(--color-bg-base)] rounded-xl p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)] mb-2">Top páginas en Plausible</p>
                  {extData.topPages?.length ? (
                    <div className="space-y-1.5">
                      {extData.topPages.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-[var(--color-text-secondary)]">{p.visitors}</span>
                          <span className="font-mono truncate flex-1 text-[var(--color-text-tertiary)]">{p.page}</span>
                          <span className="text-[var(--color-text-tertiary)]">{p.pageviews} vv</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-tertiary)]">Sin datos en el período.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-tertiary)] py-2">
                Conecta GA4 (solo pega el ID de medición) o Plausible (dominio + API key) para ver aquí sus métricas unificadas con tu embudo.
              </p>
            )}
          </div>

          {/* Daily trend */}
          <div className="surface-card p-5 rounded-2xl">
            <h3 className="text-sm font-bold mb-1">Tendencia diaria</h3>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">Vistas, leads y pedidos por día</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="views" name="Vistas" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="leads" name="Leads" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="Pedidos" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top pages + products */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="surface-card p-5 rounded-2xl">
              <h3 className="text-sm font-bold mb-3">Top Páginas por Conversión</h3>
              {topPages.length === 0 ? (
                <p className="text-center text-xs text-[var(--color-text-tertiary)] py-10">Aún no hay vistas por página.</p>
              ) : (
                <div className="space-y-2.5">
                  {topPages.map((p: any) => (
                    <div key={p.pageId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold truncate">{p.pageTitle}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">/{p.pageSlug} · {p.type}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--color-text-tertiary)]">
                        <span className="flex items-center gap-1"><Eye size={11} />{p.views}</span>
                        <span className="flex items-center gap-1"><Users size={11} />{p.leads}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px]" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                          {p.leadRate}% → lead
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="surface-card p-5 rounded-2xl">
              <h3 className="text-sm font-bold mb-3">Top Productos Vendidos (pagados)</h3>
              {topProducts.length === 0 ? (
                <p className="text-center text-xs text-[var(--color-text-tertiary)] py-10">Aún no hay ventas pagadas.</p>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0" style={{ background: 'var(--color-bg-hover)', color: 'var(--color-text-secondary)' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-extrabold truncate">{p.productName}</p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">{p.orders} pedido(s) · {p.quantity} uds</p>
                      </div>
                      <span className="text-xs font-black" style={{ color: 'var(--color-accent)' }}>
                        S/ {p.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="surface-card p-4 rounded-2xl space-y-1.5">
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</p>
      </div>
      <p className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  )
}
