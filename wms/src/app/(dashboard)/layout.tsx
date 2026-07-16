'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import NotificationBell from '@/components/notifications/NotificationBell';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse,
  Truck, BarChart3, Shield, Settings, Menu, X, ChevronRight,
  MessageSquare, UserCog, DollarSign, Tag, Percent, TrendingUp,
  LogOut, ChevronLeft, User, FileText, Gift
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tienda', label: 'Tienda', icon: Package },
  { href: '/ofertas', label: 'Ofertas', icon: Gift },
  { href: '/operaciones', label: 'Operaciones', icon: ShoppingCart },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/finanzas', label: 'Finanzas', icon: DollarSign },
  { href: '/admin', label: 'Admin', icon: UserCog },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLabel = navItems.find((i) => i.href === pathname || (i.href !== '/' && pathname.startsWith(i.href)))?.label || 'WMS';

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>
        {/* Logo - clickeable para colapsar */}
        <div className={`flex items-center h-16 border-b border-sidebar-border shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/images/logo.png" alt="AdriSu Kids" className="h-10 w-auto shrink-0" />

          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-400 shadow-sm shadow-brand-600/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-brand-400' : 'shrink-0'} />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="text-brand-400/50" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Bottom */}
        <div className="border-t border-sidebar-border p-3">
          {sidebarCollapsed ? (
            /* Collapsed: just avatar button */
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center justify-center py-2"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">AD</span>
              </div>
            </button>
          ) : (
            /* Expanded: full profile card */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">AD</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">Admin</p>
                  <p className="text-[11px] text-gray-500 truncate">admin@adriskids.com</p>
                </div>
                <ChevronRight size={14} className={`text-gray-500 transition-transform ${profileOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                    <User size={16} />
                    <span>Ver perfil</span>
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors border-t border-gray-700">
                    <LogOut size={16} />
                    <span>Cerrar sesion</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] bg-gray-900 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-16 px-5 border-b border-gray-800">
              <img src="/images/logo.png" alt="AdriSu Kids" className="h-9 w-auto" />
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-600/20 text-brand-400' : 'text-gray-400 hover:bg-white/5 hover:text-white active:bg-white/10'
                    }`}
                  >
                    <item.icon size={18} className={isActive ? 'text-brand-400' : 'text-gray-500'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile: User + Logout */}
            <div className="border-t border-gray-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">AD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Admin</p>
                  <p className="text-[11px] text-gray-500 truncate">admin@adriskids.com</p>
                </div>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
                <LogOut size={16} />
                <span>Cerrar sesion</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Simplified */}
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-white">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {/* Desktop: collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
