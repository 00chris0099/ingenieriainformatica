'use client';

import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, User, LogOut, Home, Store, Heart, UserCircle, Bed, Armchair, Baby } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/shop/CartDrawer';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Desktop & Mobile Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <img src="/images/logo.png" alt="AdriSu Kids" className="h-9 md:h-10 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Inicio</Link>
              <Link href="/tienda" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Tienda</Link>
              <Link href="/tienda?categoria=camas-cunas" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Camas</Link>
              <Link href="/tienda?categoria=sillas-altas" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sillas</Link>
              <Link href="/tienda?categoria=carritos" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Carritos</Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Search - Desktop */}
              <button className="hidden md:flex w-10 h-10 items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <Search size={20} />
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <ShoppingBag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{itemCount}</span>
                )}
              </button>

              {/* User - Desktop */}
              {mounted && session ? (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-gray-500 max-w-[100px] truncate">{session.user?.name}</span>
                  <button onClick={() => signOut()} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="Cerrar sesion">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="hidden md:flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                  <User size={18} />
                  <span className="text-xs font-medium">Entrar</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-3 border-t border-gray-100 space-y-1 animate-in slide-in-from-top duration-150">
              <Link href="/" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Home size={18} className="text-gray-400" /> Inicio
              </Link>
              <Link href="/tienda" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Store size={18} className="text-gray-400" /> Tienda
              </Link>
              <Link href="/tienda?categoria=camas-cunas" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Bed size={18} className="text-gray-400" /> Camas y Cunas
              </Link>
              <Link href="/tienda?categoria=sillas-altas" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Armchair size={18} className="text-gray-400" /> Sillas Altas
              </Link>
              <Link href="/tienda?categoria=carritos" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <Baby size={18} className="text-gray-400" /> Carritos
              </Link>
              <div className="border-t border-gray-100 mt-2 pt-2">
                {mounted && session ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <UserCircle size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{session.user?.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{session.user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 py-3 px-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut size={18} /> Cerrar sesion
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="flex items-center gap-3 py-3 px-3 text-sm font-medium text-green-600 hover:bg-green-50 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <User size={18} /> Iniciar sesion
                  </Link>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
          <Link href="/" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[56px] ${
            pathname === '/' ? 'text-green-600 bg-green-50' : 'text-gray-500'
          }`}>
            <Home size={20} strokeWidth={pathname === '/' ? 2.5 : 2} />
            <span>Inicio</span>
          </Link>
          <Link href="/tienda" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[56px] ${
            pathname === '/tienda' ? 'text-green-600 bg-green-50' : 'text-gray-500'
          }`}>
            <Store size={20} strokeWidth={pathname === '/tienda' ? 2.5 : 2} />
            <span>Tienda</span>
          </Link>
          <button onClick={() => setCartOpen(true)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[56px] relative ${
            cartOpen ? 'text-green-600 bg-green-50' : 'text-gray-500'
          }`}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{itemCount}</span>
            )}
            <span>Carrito</span>
          </button>
          <Link href="/login" className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all min-w-[56px] ${
            pathname === '/login' ? 'text-green-600 bg-green-50' : 'text-gray-500'
          }`}>
            <User size={20} strokeWidth={pathname === '/login' ? 2.5 : 2} />
            <span>Cuenta</span>
          </Link>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
