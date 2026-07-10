'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Las contrasenas no coinciden'); return; }
    if (form.password.length < 8) { setError('Minimo 8 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.name, email: form.email, password: form.password }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); setLoading(false); return; }
      const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (result?.error) { setError('Cuenta creada pero error al login'); }
      else { router.push('/'); router.refresh(); }
    } catch { setError('Error al registrar'); }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try { await signIn('google', { callbackUrl: '/' }); } catch { setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="AdriSu Kids" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Crear Cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Unete a AdriSu Kids</p>
        </div>

        <button onClick={handleGoogleLogin} disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4">
          {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          )}
          {googleLoading ? 'Conectando...' : 'Registrarse con Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">o completa el formulario</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre completo</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="Juan Perez" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Contrasena</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="Minimo 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirmar contrasena</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" placeholder="Repite tu contrasena" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Ya tienes cuenta? <Link href="/login" className="text-green-600 font-medium">Inicia sesion</Link></p>
      </div>
    </div>
  );
}
