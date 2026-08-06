'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Store, Layers, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales incorrectas o usuario no activo.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error al conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError('Error al autenticar con cuenta de Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#090d16] text-gray-100 font-sans selection:bg-pink-500 selection:text-white">
      {/* ═══════════════ IZQUIERDA: SHOWCASE DE LA PLATAFORMA (ESTILO SLACK/LINEAR CRM) ═══════════════ */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-gray-800/60 bg-gradient-to-br from-[#0c1220] via-[#0f172a] to-[#1e1b4b]">
        {/* Glow Effects Decorative */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight text-white">Storefront Studio</h2>
            <p className="text-xs text-gray-400 font-medium">Plataforma Multi-Tienda & Builder SaaS</p>
          </div>
        </div>

        {/* Center Content Showcase */}
        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
            <Sparkles size={14} /> Gestión de Tiendas Virtuales & Plantillas 1-Click
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Crea y administra tiendas de <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">alta conversión</span> en segundos.
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed">
            Accede al centro de control privado de tu agencia para diseñar páginas web, gestionar subdominios VPS y habilitar portales simplificados para tus clientes.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">Visual Builder</p>
                <p className="text-[11px] text-gray-400">Editor Drag & Drop</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-800/80 bg-gray-900/40 backdrop-blur-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">Acceso Privado</p>
                <p className="text-[11px] text-gray-400">Super Admin & 2FA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Badge Info */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-800/60">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>Servidor EasyPanel VPS activo — Entorno Seguro Multi-tenant</span>
        </div>
      </div>

      {/* ═══════════════ DERECHA: FORMULARIO DE INICIO DE SESIÓN DE ALTA SEGURIDAD ═══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#090d16] relative">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Header Branding */}
          <div className="lg:hidden text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Storefront Studio</h1>
            <p className="text-xs text-gray-400">Ingreso a la Plataforma de Tiendas</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs md:text-sm text-gray-400">
              Ingresa con tu correo autorizado de Super Admin (<span className="text-pink-400 font-semibold">anchillo00@gmail.com</span>) o tus credenciales.
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google One-Click Auth */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full h-12 px-4 rounded-xl bg-gray-900 border border-gray-700/80 hover:border-gray-600 text-gray-200 text-sm font-semibold hover:bg-gray-850 flex items-center justify-center gap-3 transition-all duration-200 shadow-sm group disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-gray-800" />
              <span className="bg-[#090d16] px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">o usa tu email</span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anchillo00@gmail.com"
                    className="w-full h-11 pl-10 pr-4 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-gray-900/80 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-pink-600/25 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando acceso...
                  </span>
                ) : (
                  <>
                    <span>Ingresar al Panel</span>
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-gray-500">
              ¿Acceso de cliente? Inicia sesión con las credenciales creadas por tu Super Admin.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-gray-400 text-sm">
          Cargando portal de inicio de sesión...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
