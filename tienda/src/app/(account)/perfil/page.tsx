'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { User, Mail, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PerfilPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(setSession).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-extrabold mb-8">Mi Perfil</h1>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{session?.user?.name || 'Usuario'}</h2>
              <p className="text-gray-500">{session?.user?.email || ''}</p>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm">{session?.user?.email || 'No disponible'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Cuenta</p>
                <p className="text-sm">Cliente</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
