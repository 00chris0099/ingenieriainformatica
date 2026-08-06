'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import NotificationBell from '@/components/notifications/NotificationBell'
import ThemeToggle from '@/components/ui/ThemeToggle'
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  Settings, Menu, X, ChevronRight, ChevronDown,
  UserCog, DollarSign, FileText, LogOut, User,
  PanelLeftClose, PanelLeft, Search
} from 'lucide-react'
import { useState, Fragment } from 'react'

interface NavGroup {
  label: string
  items: Array<{ href: string; label: string; icon: any }>
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pages', label: 'Pages', icon: FileText },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/catalogo', label: 'Catalogo', icon: Package },
      { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
      { href: '/clientes', label: 'Clientes', icon: Users },
    ],
  },
  {
    label: 'Administracion',
    items: [
      { href: '/finanzas', label: 'Finanzas', icon: DollarSign },
      { href: '/usuarios', label: 'Usuarios', icon: UserCog },
      { href: '/configuracion', label: 'Configuracion', icon: Settings },
    ],
  },
]

const allNavItems = navGroups.flatMap(g => g.items)

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
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

  const currentLabel = allNavItems.find(
    (i) => i.href === pathname || (i.href !== '/' && pathname.startsWith(i.href))
  )?.label || 'Dashboard'

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const sidebarWidth = sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'

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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-muted)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>PB</span>
            </div>
            {!sidebarCollapsed && (
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                PageBuilder
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label} className="mb-4">
                {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-2 mb-1"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {group.label}
                    </span>
                    <ChevronDown size={12}
                      className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                      style={{ color: 'var(--color-text-tertiary)' }}
                    />
                  </button>
                )}
                {(!sidebarCollapsed && isCollapsed) ? null : (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                            sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                          }`}
                          style={active ? {
                            background: 'var(--color-bg-selected)',
                            color: 'var(--color-accent)',
                            boxShadow: 'inset 2px 0 0 0 var(--color-accent)',
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
                            <span className="flex-1">{item.label}</span>
                          )}
                          {!sidebarCollapsed && active && (
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
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
        <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-center py-2"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-accent-muted)' }}
              >
                <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>U</span>
              </div>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>U</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>Admin</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>admin@pagebuilder.com</p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--color-text-tertiary)' }}
                  className={`transition-transform duration-200 ${profileOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden animate-fade-in-down"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <Link href="/usuarios" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <User size={16} />
                    <span>Ver perfil</span>
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                    style={{ color: 'var(--color-error)', borderTop: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesion</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════ MOBILE SIDEBAR ═══════════════ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[var(--z-overlay)] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] flex flex-col shadow-2xl animate-slide-in-left"
            style={{ background: 'var(--color-bg-surface)' }}
          >
            <div className="flex items-center justify-between h-16 px-5"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>PB</span>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>PageBuilder</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-3">
                  <div className="px-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      {group.label}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                          style={active ? {
                            background: 'var(--color-bg-selected)',
                            color: 'var(--color-accent)',
                          } : {
                            color: 'var(--color-text-secondary)',
                          }}
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

            <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-accent-muted)' }}
                >
                  <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>U</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>Admin</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>admin@pagebuilder.com</p>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  background: 'var(--color-bg-hover)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <LogOut size={16} />
                <span>Cerrar sesion</span>
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
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Workspace</span>
              <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{currentLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search */}
            <button className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
            >
              <Search size={18} />
            </button>

            <ThemeToggle />
            <NotificationBell />

            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
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
