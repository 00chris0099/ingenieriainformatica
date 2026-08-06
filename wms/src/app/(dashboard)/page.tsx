'use client'

import { TrendingUp, ShoppingCart, AlertTriangle, Users, Clock, Package, ArrowRight, DollarSign, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatCardSkeleton } from '@/components/ui/Skeleton'

import { useSession } from 'next-auth/react'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  lowStockProducts: number
  totalCustomers: number
  totalRevenue: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customer: string
  total: number
  status: string
  createdAt: string
}

const PIE_COLORS = ['#ec4899', '#3b82f6', '#a855f7', '#06b6d4', '#22c55e', '#ef4444']

const statusVariant: Record<string, 'warning' | 'info' | 'accent' | 'success' | 'error' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'accent',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
}

import ClientOnboardingModal from '@/components/onboarding/ClientOnboardingModal'

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const isSuperAdmin = ['super_admin', 'admin'].includes(userRole)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if new client user needs onboarding
    if (session?.user && !isSuperAdmin) {
      const completed = localStorage.getItem(`onboarding_completed_${session.user.id}`)
      if (!completed) setShowOnboarding(true)
    }
  }, [session, isSuperAdmin])

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/v1/dashboard/stats?period=month'),
          fetch('/api/v1/orders?limit=10'),
        ])
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData.data || [])
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const ordersByStatus = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(ordersByStatus).map(([name, value]) => ({ name, value }))

  const barData = orders.slice(0, 7).map((o) => ({
    name: o.orderNumber.slice(-8),
    total: Number(o.total),
  }))

  const statCards = [
    { label: 'Productos', sub: `${stats?.activeProducts || 0} activos`, value: stats?.totalProducts?.toString() || '0', icon: Package, accent: 'var(--color-info)', bg: 'var(--color-info-muted)', href: '/catalogo' },
    { label: 'Pedidos', sub: `${stats?.pendingOrders || 0} pendientes`, value: stats?.totalOrders?.toString() || '0', icon: ShoppingCart, accent: 'var(--color-warning)', bg: 'var(--color-warning-muted)', href: '/pedidos' },
    { label: 'Stock Bajo', sub: 'Requiere atencion', value: stats?.lowStockProducts?.toString() || '0', icon: AlertTriangle, accent: 'var(--color-error)', bg: 'var(--color-error-muted)', href: '/catalogo' },
    { label: 'Clientes', sub: 'Total registrados', value: stats?.totalCustomers?.toString() || '0', icon: Users, accent: 'var(--color-success)', bg: 'var(--color-success-muted)', href: '/clientes' },
  ]

  return (
    <div className="space-y-6 stagger-children">
      {/* Header Banner Adaptativo */}
      <div className="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(59,130,246,0.08) 100%)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-pink-400 bg-pink-500/10 border border-pink-500/20">
              {isSuperAdmin ? 'Agencia Super Admin' : 'Portal de Tienda Virtual'}
            </span>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Bienvenido, {session?.user?.name || 'Comerciante'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {isSuperAdmin
              ? 'Gestión centralizada de páginas, plantillas, clientes y subdominios.'
              : 'Administra tus productos, precios, inventario y atiende los pedidos de tu tienda.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <Link
              href="/pages"
              className="px-4 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Plus size={14} /> Crear Nueva Página / Tienda
            </Link>
          ) : (
            <Link
              href="/catalogo"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Package size={14} /> Gestionar Mis Productos
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Revenue */}
      <Card variant="glass" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Revenue del Mes</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
              S/ {stats?.totalRevenue?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-success-muted)' }}>
            <DollarSign size={22} style={{ color: 'var(--color-success)' }} />
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="default" padding="md">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Pedidos por Valor
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} />
                <Tooltip contentStyle={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                }} />
                <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {loading ? 'Cargando...' : 'Sin datos'}
            </div>
          )}
        </Card>

        <Card variant="default" padding="md">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Pedidos por Estado
          </h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px',
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {loading ? 'Cargando...' : 'Sin datos'}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="default" padding="md">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
          Accesos Rapidos
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Nuevo Producto', icon: Plus, href: '/catalogo' },
            { label: 'Ver Pedidos', icon: ShoppingCart, href: '/pedidos' },
            { label: 'Revisar Stock', icon: AlertTriangle, href: '/catalogo' },
            { label: 'Ver Reportes', icon: TrendingUp, href: '/' },
          ].map((action) => (
            <Link key={action.label} href={action.href}
              className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--color-bg-hover)',
                color: 'var(--color-text-secondary)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-active)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <action.icon size={16} />
              {action.label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent Orders */}
      <Card variant="default" padding="none">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Pedidos Recientes
          </h3>
          <Link href="/pedidos" className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
            Ver todos
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {loading ? 'Cargando...' : 'No hay pedidos aun'}
          </div>
        ) : (
          <div>
            {orders.map((order) => (
              <Link key={order.id} href={`/pedidos?id=${order.id}`}
                className="px-5 py-3 flex items-center justify-between transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-hover)' }}>
                    <Clock size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{order.orderNumber}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{order.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <Badge variant={statusVariant[order.status] || 'neutral'}>{order.status}</Badge>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>S/ {order.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
