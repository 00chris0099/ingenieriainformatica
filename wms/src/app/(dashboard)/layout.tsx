'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import NotificationBell from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, Menu, X, ChevronRight, ChevronDown,
  DollarSign, FileText, LogOut, User,
  PanelLeftClose, PanelLeft, Search, Wand2, ShieldAlert, Store, Newspaper, CalendarDays, CreditCard, TrendingUp
} from 'lucide-react'
import { useState } from 'react'

interface NavGroup {
  label: string
  items: Array<{ href: string; label: string; icon: any; superAdminOnly?: boolean }>
}

// Dedicated Super Admin Agency Navigation Groups
const superAdminNavGroups: NavGroup[] = [
  {
    label: 'AGENCIA & DISEÑO WEB',
    items: [
      { href: '/', label: 'Dashboard General', icon: LayoutDashboard },
      { href: '/builder', label: 'Diseñador Visual', icon: Wand2 },
      { href: '/pages', label: 'Páginas & Landing Pages', icon: FileText },
    ],
  },
  {
    label: 'GESTIÓN DE CLIENTES',
    items: [
      { href: '/clientes', label: 'Clientes Registrados', icon: Users },
      { href: '/finanzas', label: 'Finanzas & Facturación', icon: DollarSign },
    ],
  },
  {
    label: 'CONTENIDO & SEO',
    items: [
      { href: '/blog', label: 'Blog & Artículos', icon: Newspaper },
      { href: '/leads', label: 'Leads & CRM', icon: Users },
      { href: '/analytics', label: 'Analytics & Embudo', icon: TrendingUp },
      { href: '/citas', label: 'Citas & Agenda', icon: CalendarDays },
    ],
  },
  {
    label: 'CONTROL SUPER ADMIN',
    items: [
      { href: '/configuracion', label: 'Configuración & Dominios', icon: Settings },
      { href: '/pagos', label: 'Pagos & Cobros', icon: CreditCard },
      { href: '/auditoria', label: 'Auditoría & Logs', icon: ShieldAlert },
    ],
  },
]

// Simplified Client Store Navigation Groups
const clientNavGroups: NavGroup[] = [
  {
    label: 'MIS TIENDAS VIRTUALES',
    items: [
      { href: '/mis-tiendas', label: 'Mis Tiendas', icon: Store },
      { href: '/', label: 'Panel de Control', icon: LayoutDashboard },
      { href: '/catalogo', label: 'Catálogo de Productos', icon: Package },
      { href: '/pedidos', label: 'Pedidos & WhatsApp', icon: ShoppingCart },
      { href: '/pagos', label: 'Pagos & Cobros', icon: CreditCard },
      { href: '/leads', label: 'Leads de mis Landings', icon: Users },
      { href: '/analytics', label: 'Analytics de mi Tienda', icon: TrendingUp },
      { href: '/blog', label: 'Blog de mi Tienda', icon: Newspaper },
      { href: '/citas', label: 'Citas & Agenda', icon: CalendarDays },
    ],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || ''
  const userEmail = session?.user?.email || 'anchillo00@gmail.com'
  const isSuperAdmin = userEmail === 'anchillo00@gmail.com' || ['super_admin', 'admin'].includes(userRole)

  const navGroups = isSuperAdmin ? superAdminNavGroups : clientNavGroups

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const allNavItems = navGroups.flatMap(g => g.items)
  const currentLabel = allNavItems.find(
    (i) => i.href === pathname || (i.href !== '/' && pathname.startsWith(i.href))
  )?.label || 'Dashboard'

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const sidebarWidth = sidebarCollapsed ? 'w-[70px]' : 'w-[270px]'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-base)' }}>
      {/* ═══════════════ DESKTOP SIDEBAR ═══════════════ */}
      <aside className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-[var(--ease-spring)] ${sidebarWidth}`}
        style={{
          background: 'var(--color-bg-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-9 w-auto shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-extrabold tracking-tight text-white">
                E-STORE <span className="text-red-500 font-bold text-xs uppercase tracking-wider block">Agencia VPS</span>
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide space-y-4">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-2 mb-1.5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                      {group.label}
                    </span>
                    <ChevronDown size={12}
                      className={`transition-transform duration-200 text-gray-500 ${isCollapsed ? '-rotate-90' : ''}`}
                    />
                  </button>
                )}
                {(!sidebarCollapsed && isCollapsed) ? null : (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                            sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3.5 py-2.5'
                          }`}
                          style={active ? {
                            background: 'var(--color-bg-selected)',
                            color: 'var(--color-accent)',
                            boxShadow: 'inset 3px 0 0 0 var(--color-accent)',
                          } : {
                            color: 'var(--color-text-secondary)',
                          }}
                          onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'
                          }}
                          onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <item.icon size={18} style={active ? { color: 'var(--color-accent)' } : {}} />
                          {!sidebarCollapsed && (
                            <span className="flex-1 truncate">{item.label}</span>
                          )}
                          {!sidebarCollapsed && active && (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User Profile - Bottom */}
        <div className="p-3 border-t border-[var(--color-border)] relative">
          {sidebarCollapsed ? (
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-center py-2"
            >
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-600/30">
                SA
              </div>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-gray-900"
              >
                <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-600/30 shrink-0">
                  SA
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-extrabold text-white truncate flex items-center gap-1.5">
                    <span>{isSuperAdmin ? 'Super Admin' : 'Cliente'}</span>
                    {isSuperAdmin && (
                      <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                        PRO
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                </div>
                <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-90' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl bg-gray-950 border border-gray-800 shadow-2xl overflow-hidden animate-fade-in-down z-50">
                  <Link
                    href="/configuracion"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-gray-900"
                  >
                    <User size={14} />
                    <span>Ajustes de Perfil</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-600/10 border-t border-gray-800"
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════ MOBILE SIDEBAR ═══════════════ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] flex flex-col bg-[#090d16] border-r border-gray-800 shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between h-16 px-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-8 w-auto" />
                <span className="text-sm font-bold text-white">E-STORE PLATFORM</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-2 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">{group.label}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            active ? 'bg-red-600/10 text-red-500 border border-red-600/20' : 'text-gray-400 hover:bg-gray-900'
                          }`}
                        >
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-600/10 border border-red-600/20"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors text-gray-400 hover:text-white"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold">{isSuperAdmin ? 'Panel Super Admin' : 'Panel Cliente'}</span>
              <ChevronRight size={12} className="text-gray-600" />
              <span className="text-sm font-bold text-white">{currentLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 transition-colors"
              title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
