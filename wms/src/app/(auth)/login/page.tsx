'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, RefreshCw, KeyRound, CheckCircle2, Sparkles, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'login' | 'otp' | 'totp'>('login');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = otpDigits.join('');

  // Anti-bot Captcha state
  const [num1, setNum1] = useState(6);
  const [num2, setNum2] = useState(7);
  const [captchaInput, setCaptchaInput] = useState('');

  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    setInfoMsg('');

    // Anti-bot verification
    if (Number(captchaInput) !== num1 + num2) {
      setError('Respuesta Anti-bot incorrecta. Resuelve la suma para continuar.');
      generateCaptcha();
      return;
    }

    const emailClean = email.trim().toLowerCase();
    const passwordClean = password.trim();

    if (!emailClean || !passwordClean) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      // PRE-VALIDATE EMAIL & PASSWORD FIRST BEFORE SENDING CODE
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailClean,
          password: passwordClean,
          type: 'admin_login',
          captchaAnswer: captchaInput,
          captchaExpected: num1 + num2,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Correo o contraseña incorrectos.');
        generateCaptcha();
      } else if (data.twoFactorRequired) {
        // 2FA TOTP activada: pide el código del autenticador (server-verified)
        setInfoMsg(data.message || 'Ingresa el código de 6 dígitos de tu app de autenticación.');
        setStep('totp');
      } else if (!data.emailSent && data.devCode) {
        // MODO DESARROLLO: el email no se pudo entregar (p. ej. Resend sandbox) y
        // el servidor devolvió el código directamente para poder ingresar.
        setOtpDigits(data.devCode.padStart(6, '0').split('').slice(0, 6));
        setInfoMsg(data.message || `[MODO DESARROLLO] El email no se entregó. Usa el código ${data.devCode}.`);
        setStep('otp');
      } else if (!data.emailSent) {
        // El email no se entregó y no hay fallback: error claro para el usuario.
        setError(data.message || 'No se pudo enviar el correo de verificación. Contacta al administrador.');
        generateCaptcha();
      } else {
        // Credentials are valid -> move to email OTP verification step
        setInfoMsg(data.message || `Se ha enviado un código de verificación de 6 dígitos a ${emailClean}`);
        setStep('otp');
      }
    } catch {
      setError('Error al procesar la verificación. Inténtalo de nuevo.');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const executeSignIn = async (extra: Record<string, string> = {}) => {
    setLoading(true);
    try {
      // La contraseña SIEMPRE se valida en el servidor. Si la cuenta tiene 2FA,
      // el código del autenticador se verifica en el authorize (RFC 6238).
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        ...extra,
        redirect: false,
      });

      if (result?.error) {
        setError('Error de autenticación. Inténtalo de nuevo.');
        generateCaptcha();
      } else {
        window.location.href = callbackUrl || '/';
      }
    } catch {
      setError('Error al procesar el inicio de sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos de tu app de autenticación.');
      return;
    }
    await executeSignIn({ code: otpCode.trim() });
  };

  const handleOtpChange = (idx: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    if (clean && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (next.join('').length === 6) {
      otpRefs.current[5]?.blur();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Código de verificación incorrecto.');
        setLoading(false);
        return;
      }

      await executeSignIn();
    } catch {
      setError('Error al verificar el código de seguridad.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const configRes = await fetch('/api/v1/auth/config');
      const configData = await configRes.json();
      if (!configData.googleConfigured) {
        setError('⚠️ El acceso con Google requiere agregar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en las Variables de Entorno de EasyPanel.');
        setGoogleLoading(false);
        return;
      }
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setError('Error al conectar con Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#090d16] text-white font-sans selection:bg-red-600 selection:text-white relative overflow-hidden">
      {/* ═══════════════ 2D BACKGROUND ANIMATIONS (FLOATING PARTICLES & PULSING GLOW) ═══════════════ */}
      <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-red-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-red-600/10 rounded-full blur-3xl pointer-events-none animate-bounce" style={{ animationDuration: '7s' }} />

      {/* Floating 2D Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 left-1/3 w-2 h-2 rounded-full bg-red-500/30 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-2/3 left-1/4 w-3 h-3 rounded-full bg-red-600/20 animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 rounded-full bg-red-400/40 animate-ping" style={{ animationDuration: '4s' }} />
      </div>

      {/* ═══════════════ IZQUIERDA: SHOWCASE ANIMADO 2D ROJO Y NEGRO ═══════════════ */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-gray-800/80 bg-gradient-to-br from-[#000000] via-[#090d16] to-[#1a0505]">
        {/* Logo de Marca Oficial con ondas animadas 2D */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Animated 2D Ripple Rings */}
            <span className="absolute w-14 h-14 rounded-full bg-red-600/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <span className="absolute w-11 h-11 rounded-full bg-red-600/30 animate-pulse" style={{ animationDuration: '1.5s' }} />
            <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-12 w-auto relative z-10 transform transition-transform duration-300 hover:scale-110" />
          </div>
          <div className="border-l border-gray-800 pl-4">
            <h2 className="font-extrabold text-xl tracking-tight text-white">E-STORE PLATFORM</h2>
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest">Sistema de Tiendas Virtuales</p>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider shadow-lg">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '4s' }} /> Acceso Seguro Multi-tenant
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Plataforma de Administración y <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">Gestión Comercial</span>.
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed">
            Ingresa a tu panel de administración para gestionar productos, actualizar precios, revisar pedidos e impulsar tus ventas virtuales.
          </p>

          <div className="p-4 rounded-2xl border border-gray-800 bg-black/60 backdrop-blur-md space-y-2 hover:border-red-600/50 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <CheckCircle2 size={16} className="text-red-500 shrink-0" />
              <span>Verificación de Código por Correo Electrónico</span>
            </div>
            <p className="text-xs text-gray-400">
              Pre-validación de credenciales y protección multi-capa contra bots.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500 border-t border-gray-800/80 pt-4 flex items-center justify-between">
          <span>© 2026 Plataforma de Tiendas Virtuales</span>
          <span className="text-red-500 font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            Estado: En Línea
          </span>
        </div>
      </div>

      {/* ═══════════════ DERECHA: FORMULARIO DE INICIO DE SESIÓN CON TRANSICIÓN ANIMADA 2D ═══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#090d16] relative overflow-y-auto z-10">
        <div className="w-full max-w-md space-y-7 my-auto">
          
          <div className="flex items-center gap-3">
            <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-10 w-auto" />
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Iniciar Sesión</h2>
              <p className="text-xs text-gray-400">Accede a tu tienda o regístrate con Google</p>
            </div>
          </div>

          {/* Mensajes de Error y Estado */}
          {error && (
            <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/30 text-red-400 text-xs flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/30 text-red-400 text-xs flex items-center gap-3 animate-fade-in">
              <KeyRound size={16} className="text-red-500 shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* Botón de Google Sign-In */}
          {step === 'login' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 px-4 rounded-xl bg-gray-950 border border-gray-800 hover:border-red-600/60 text-gray-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-sm disabled:opacity-50 group hover:scale-[1.01]"
              >
                <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{googleLoading ? 'Conectando...' : 'Continuar con Google (Auto-Registro)'}</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-gray-800" />
                <span className="bg-[#090d16] px-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">o con tu correo</span>
              </div>
            </div>
          )}

          {/* PASO 1: CORREO + CONTRASEÑA + ANTI-BOT CAPTCHA */}
          {step === 'login' && (
            <form onSubmit={handleInitialSubmit} className="space-y-4 animate-fade-in">
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 hover:scale-[1.01]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin h-4 w-4 text-white" />
                    Validando datos...
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

          {/* PASO 2: CÓDIGO DE VERIFICACIÓN — OTP por email o TOTP del autenticador */}
          {(step === 'otp' || step === 'totp') && (
            <form onSubmit={step === 'totp' ? handleVerifyTotp : handleVerifyOtp} className="space-y-5 animate-slide-in">
              <div className="p-4 rounded-2xl bg-red-600/10 border border-red-600/30 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <KeyRound size={16} />
                  <span>{step === 'totp' ? 'Verificación en dos pasos (Autenticador)' : 'Verificación de Seguridad requerida'}</span>
                </div>
                {step === 'totp' ? (
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Tu cuenta tiene <span className="font-bold text-white">2FA (TOTP)</span> activado. Abre tu app de
                    autenticación (Google Authenticator, Authy…) y escribe el código de 6 dígitos para{' '}
                    <span className="font-bold text-white">{email}</span>. El código se verifica en el servidor.
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Se ha enviado un código de verificación de 6 dígitos al correo <span className="font-bold text-white">{email}</span>. Revisa tu bandeja de entrada o SPAM.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Código de 6 dígitos
                </label>
                <div className="flex gap-2 justify-between">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onFocus={(e) => e.target.select()}
                      autoFocus={idx === 0}
                      className="w-11 h-14 md:w-12 text-center font-mono text-xl font-bold tracking-widest bg-gray-950 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('login'); setOtpDigits(Array(6).fill('')); }}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
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
                Regístrate con Correo
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#090d16] text-gray-400 text-sm">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
