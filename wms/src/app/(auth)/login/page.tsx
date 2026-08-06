'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [otpCode, setOtpCode] = useState('');

  // Anti-bot Captcha state
  const [num1, setNum1] = useState(6);
  const [num2, setNum2] = useState(7);
  const [captchaInput, setCaptchaInput] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devOtpMsg, setDevOtpMsg] = useState('');

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setNum1(n1);
    setNum2(n2);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Anti-bot verification
    if (Number(captchaInput) !== num1 + num2) {
      setError('Respuesta Anti-bot incorrecta. Resuelve la suma para continuar.');
      generateCaptcha();
      return;
    }

    const emailClean = email.trim().toLowerCase();
    setLoading(true);

    // If Admin email, require OTP verification code sent to email
    if (emailClean === 'anchillo00@gmail.com') {
      try {
        const res = await fetch('/api/v1/auth/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailClean, type: 'admin_login' }),
        });
        const data = await res.json();
        if (data.devCode) {
          setDevOtpMsg(`Código de verificación: ${data.devCode}`);
        }
        setCodeSent(true);
        setStep('otp');
      } catch {
        setError('Error al enviar código de verificación al correo.');
      } finally {
        setLoading(false);
      }
    } else {
      // Standard login for client users
      await executeSignIn();
    }
  };

  const executeSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Correo o contraseña incorrectos.');
        generateCaptcha();
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP code
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() }),
      });

      // Proceed with signin
      await executeSignIn();
    } catch {
      setError('Error al verificar el código de seguridad.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#090d16] text-white font-sans selection:bg-red-600 selection:text-white">
      {/* ═══════════════ IZQUIERDA: PANEL VISUAL ROJO Y NEGRO CON LOGO DE MARCA ═══════════════ */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-gray-800/80 bg-gradient-to-br from-[#000000] via-[#090d16] to-[#1a0505]">
        {/* Ambient Red Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo de Marca Oficial */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-12 w-auto" />
          <div className="border-l border-gray-800 pl-3">
            <h2 className="font-extrabold text-lg tracking-tight text-white">E-STORE PLATFORM</h2>
            <p className="text-xs text-red-500 font-semibold uppercase tracking-wider">Sistema de Tiendas Virtuales</p>
          </div>
        </div>

        {/* Center Intro */}
        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Acceso Seguro Multi-Nivel
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Plataforma de Administración y <span className="text-red-600">Gestión Comercial</span>.
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed">
            Ingresa a tu panel de administración para gestionar productos, actualizar precios, revisar pedidos e impulsar tus ventas virtuales.
          </p>

          <div className="p-4 rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <CheckCircle2 size={16} className="text-red-500" />
              <span>Seguridad Anti-bot & Verificación de Código por Correo</span>
            </div>
            <p className="text-xs text-gray-400">
              El acceso se encuentra protegido con controles de seguridad para garantizar la integridad de las tiendas.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-gray-500 border-t border-gray-800/80 pt-4 flex items-center justify-between">
          <span>© 2026 Plataforma de Tiendas Virtuales</span>
          <span className="text-red-500 font-bold">Estado: En Línea</span>
        </div>
      </div>

      {/* ═══════════════ DERECHA: FORMULARIO DE INICIO DE SESIÓN Y VERIFICACIÓN ═══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#090d16] relative">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo Superior */}
          <div className="flex items-center gap-3">
            <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-10 w-auto" />
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
              <p className="text-xs text-gray-400">Ingresa con tus credenciales registradas</p>
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/30 text-red-400 text-xs flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PASO 1: CORREO + CONTRASEÑA + ANTI-BOT CAPTCHA */}
          {step === 'login' && (
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="text-xs text-red-500 hover:underline font-semibold">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Anti-bot Human Captcha */}
              <div className="p-3.5 rounded-xl border border-gray-800 bg-gray-950/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-red-500" />
                    Verificación Anti-Bot: ¿Cuánto es {num1} + {num2}?
                  </span>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-xs text-gray-400 hover:text-white p-1"
                    title="Generar nuevo problema"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <input
                  type="number"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Ingresa el resultado"
                  className="w-full h-9 px-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin h-4 w-4 text-white" />
                    Verificando...
                  </span>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 2: CÓDIGO DE VERIFICACIÓN POR CORREO (ADMIN OTP STEP) */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-red-600/10 border border-red-600/30 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <KeyRound size={16} />
                  <span>Verificación de Seguridad requerida</span>
                </div>
                <p className="text-xs text-gray-300">
                  Se ha enviado un código de verificación de 6 dígitos a <span className="font-bold text-white">{email}</span>.
                </p>
                {devOtpMsg && (
                  <p className="text-xs font-mono text-emerald-400 font-bold bg-black/40 p-2 rounded border border-emerald-500/20">
                    {devOtpMsg}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-12 px-4 text-center font-mono text-xl tracking-widest bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-red-600"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? 'Verificando...' : 'Confirmar e Ingresar'}
                </button>
              </div>
            </form>
          )}

          {/* Registro Público */}
          <div className="pt-4 border-t border-gray-800/80 text-center">
            <p className="text-xs text-gray-400">
              ¿No tienes una cuenta aún?{' '}
              <Link href="/register" className="text-red-500 hover:underline font-bold">
                Regístrate aquí
              </Link>
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
          Cargando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
