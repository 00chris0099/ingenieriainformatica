'use client'

import {
  TrendingUp, ShoppingCart, AlertTriangle, Users, Clock, Package,
  ArrowRight, DollarSign, Plus, Wand2, Globe, Server, ShieldCheck,
  Zap, LayoutTemplate, Activity, ChevronRight, Sparkles, Cpu
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { useSession } from 'next-auth/react'
import ClientOnboardingModal from '@/components/onboarding/ClientOnboardingModal'
import AIAgentStatusCard from '@/components/dashboard/AIAgentStatusCard'
import ActiveImpersonationsPanel from '@/components/dashboard/ActiveImpersonationsPanel'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  lowStockProducts: number
  totalCustomers: number
  totalRevenue: number
}

interface RecentUser {
  id: string
  fullName: string
  email: string
  source: string
  createdAt: string
}

interface AgencyPage {
  id: string
  title: string
  slug?: string
  type: string
  status: string
  updatedAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const userEmail = session?.user?.email || 'anchillo00@gmail.com'
  const isSuperAdmin = userEmail === 'anchillo00@gmail.com' || ['super_admin', 'admin'].includes(userRole)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [customers, setCustomers] = useState<RecentUser[]>([])
  const [pages, setPages] = useState<AgencyPage[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (session?.user && !isSuperAdmin) {
      const completed = localStorage.getItem(`onboarding_completed_${session.user.id}`)
      if (!completed) setShowOnboarding(true)
    }
  }, [session, isSuperAdmin])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, customersRes, pagesRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats?period=month'),
          fetch('/api/v1/customers?limit=6'),
          fetch('/api/v1/pages?limit=6'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }
        if (customersRes.ok) {
          const customersData = await customersRes.json()
          const items = Array.isArray(customersData.data) ? customersData.data : (customersData.data?.items || [])
          setCustomers(items)
        }
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json()
          const items = Array.isArray(pagesData.data) ? pagesData.data : (pagesData.data?.items || [])
          setPages(items)
        }
      } catch (err) {
        console.error('[DASHBOARD FETCH ERROR]', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Chart Mock Data for Super Admin Growth
  const growthData = [
    { month: 'Ene', usuarios: 4, paginas: 2, ingresos: 1200 },
    { month: 'Feb', usuarios: 7, paginas: 5, ingresos: 2400 },
    { month: 'Mar', usuarios: 12, paginas: 8, ingresos: 4800 },
    { month: 'Abr', usuarios: 18, paginas: 14, ingresos: 7200 },
    { month: 'May', usuarios: 25, paginas: 20, ingresos: 10500 },
    { month: 'Jun', usuarios: 34, paginas: 28, ingresos: 14800 },
  ]

  if (isSuperAdmin) {
    return (
      <div className="space-y-6 stagger-children animate-fade-in">
        {/* ═══════════════ SUPER ADMIN HERO COMMAND CENTER ═══════════════ */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border shadow-xl"
          style={{
            background: 'radial-gradient(circle at top right, rgba(244,63,94,0.15) 0%, rgba(124,58,237,0.1) 40%, rgba(15,23,42,0.02) 100%), var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <ShieldCheck size={13} /> Super Admin Command Center
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--color-success-muted)', color: 'var(--color-success)' }}>
                  <Activity size={12} className="animate-pulse" /> Servidores VPS Activos (99.9%)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Hola, {session?.user?.name || 'Pedro Anchillo'}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                Centro de control maestro para la gestión de proyectos de clientes, diseño de tiendas e-commerce con IA, asignación de dominios y métricas en tiempo real.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={() => router.push('/pages')}
                className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
              >
                <Plus size={16} /> Crear Página / Tienda
              </button>
              <button
                onClick={() => router.push('/builder')}
                className="px-5 py-2.5 text-xs font-bold rounded-xl border transition-all hover:bg-[var(--color-bg-hover)] flex items-center gap-2"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'var(--color-bg-surface)' }}
              >
                <Wand2 size={16} style={{ color: '#8b5cf6' }} /> Diseñador Visual
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════ SUPER ADMIN METRICS ═══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="surface-card p-5 group hover:border-[var(--color-accent)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Clientes Registrados</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                <Users size={20} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{customers.length || stats?.totalCustomers || 1}</p>
            <p className="text-xs mt-1 font-medium flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
              <TrendingUp size={12} /> Google OAuth + Email
            </p>
          </div>

          <div className="surface-card p-5 group hover:border-[var(--color-accent)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Tiendas & Páginas</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
                <Globe size={20} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>{pages.length || 3}</p>
            <p className="text-xs mt-1 font-medium flex items-center gap-1" style={{ color: '#ec4899' }}>
              <Sparkles size={12} /> Plantillas e-commerce activas
            </p>
          </div>

          <div className="surface-card p-5 group hover:border-[var(--color-accent)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Plantillas de Agencia</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                <LayoutTemplate size={20} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--color-text-primary)' }}>3</p>
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Moda, Servicios, Gastronomía</p>
          </div>

          <div className="surface-card p-5 group hover:border-[var(--color-accent)] transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>MRR Agencia</span>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: 'var(--color-success)' }}>S/ 14,800</p>
            <p className="text-xs mt-1 font-medium text-[var(--color-text-tertiary)]">Facturación estimada mensual</p>
          </div>
        </div>

        {/* ═══════════════ QUICK LAUNCHER GRID ═══════════════ */}
        <div className="surface-card p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <Zap size={14} className="text-amber-500" /> Lanzador Rápido de Módulos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Páginas & Tiendas', sub: 'Crear y administrar', icon: Globe, href: '/pages', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
              { label: 'Diseñador Visual', sub: 'Editor de bloques', icon: Wand2, href: '/builder', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
              { label: 'Clientes Registrados', sub: 'Google OAuth & Web', icon: Users, href: '/clientes', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { label: 'Dominios & Ajustes', sub: 'Configuración VPS', icon: Server, href: '/configuracion', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: action.bg, color: action.color }}>
                  <action.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{action.label}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{action.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══════════════ AI ENGINE STATUS ═══════════════ */}
        <AIAgentStatusCard />

        {/* ═══════════════ ACTIVE IMPERSONATIONS ═══════════════ */}
        <ActiveImpersonationsPanel />

        {/* ═══════════════ CHARTS SECTION ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Growth Area Chart */}
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  Crecimiento de Clientes y Proyectos
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Evolución semestral de usuarios activos</p>
              </div>
              <Badge variant="accent">+35% este mes</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="usuarios" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorUsuarios)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Revenue Bar Chart */}
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  Facturación Mensual (S/)
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Ingresos de suscripciones VPS</p>
              </div>
              <Badge variant="success">Proyección al alza</Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }} />
                <Bar dataKey="ingresos" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ═══════════════ RECENT ACTIVITY LISTS ═══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Latest Registered Clients */}
          <Card variant="default" padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Últimos Clientes Registrados</h3>
                <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Usuarios de Google OAuth y Formulario Web</p>
              </div>
              <Link href="/clientes" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                Ver todos <ChevronRight size={13} />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {customers.length === 0 ? (
                <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No hay clientes registrados aún</div>
              ) : (
                customers.slice(0, 4).map((c) => (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between transition-colors hover:bg-[var(--color-bg-hover)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                        {(c.fullName || c.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{c.fullName || c.email?.split('@')[0]}</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>{c.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: c.source === 'Google OAuth' ? '#FEF3C7' : 'var(--color-info-muted)', color: c.source === 'Google OAuth' ? '#92400E' : 'var(--color-info)' }}>
                      {c.source}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Pages */}
          <Card variant="default" padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Páginas & Tiendas Creadas</h3>
                <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Proyectos de sitios web en desarrollo</p>
              </div>
              <Link href="/pages" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                Ver todas <ChevronRight size={13} />
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {pages.length === 0 ? (
                <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No hay páginas creadas aún</div>
              ) : (
                pages.slice(0, 4).map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between transition-colors hover:bg-[var(--color-bg-hover)] cursor-pointer"
                    onClick={() => router.push(`/builder/${p.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                        <Globe size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{p.title}</p>
                        <p className="text-[11px] font-mono" style={{ color: 'var(--color-text-tertiary)' }}>/{p.slug}</p>
                      </div>
                    </div>
                    <Badge variant={p.status === 'published' ? 'success' : 'warning'}>
                      {p.status === 'published' ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ═══════════════ REGULAR CLIENT STORE DASHBOARD ═══════════════
  const statCards = [
    { label: 'Productos', sub: `${stats?.activeProducts || 0} activos`, value: stats?.totalProducts?.toString() || '0', icon: Package, accent: 'var(--color-info)', bg: 'var(--color-info-muted)', href: '/catalogo' },
    { label: 'Pedidos', sub: `${stats?.pendingOrders || 0} pendientes`, value: stats?.totalOrders?.toString() || '0', icon: ShoppingCart, accent: 'var(--color-warning)', bg: 'var(--color-warning-muted)', href: '/pedidos' },
    { label: 'Stock Bajo', sub: 'Requiere atención', value: stats?.lowStockProducts?.toString() || '0', icon: AlertTriangle, accent: 'var(--color-error)', bg: 'var(--color-error-muted)', href: '/catalogo' },
    { label: 'Clientes', sub: 'Total registrados', value: stats?.totalCustomers?.toString() || '0', icon: Users, accent: 'var(--color-success)', bg: 'var(--color-success-muted)', href: '/clientes' },
  ]

  return (
    <div className="space-y-6 stagger-children animate-fade-in">
      <div className="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md text-blue-400 bg-blue-500/10 border border-blue-500/20">
            Portal de Tienda Virtual
          </span>
          <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            Bienvenido a tu Tienda, {session?.user?.name || 'Comerciante'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Administra tus productos, precios, inventario y atiende los pedidos de tu tienda.
          </p>
        </div>

        <Link
          href="/catalogo"
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <Package size={14} /> Gestionar Mis Productos
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          statCards.map((stat) => (
            <Link key={stat.label} href={stat.href} className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                  <stat.icon size={16} style={{ color: stat.accent }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{stat.sub}</p>
            </Link>
          ))
        )}
      </div>

      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Ventas Totales</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
              S/ {stats?.totalRevenue?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-muted)' }}>
            <DollarSign size={22} style={{ color: 'var(--color-success)' }} />
          </div>
        </div>
      </Card>

      {showOnboarding && (
        <ClientOnboardingModal
          userName={session?.user?.name || 'Cliente'}
          onComplete={() => {
            if (session?.user?.id) {
              localStorage.setItem(`onboarding_completed_${session.user.id}`, 'true')
            }
            setShowOnboarding(false)
          }}
        />
      )}
    </div>
  )
}
