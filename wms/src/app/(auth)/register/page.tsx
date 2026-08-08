'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ShieldCheck, RefreshCw, ArrowRight, CheckCircle2, KeyRound, Eye, EyeOff, Zap } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');

  // Password strength meter
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();
  const strengthLabel = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][passwordStrength];
  const strengthColor = ['#ef4444', '#ef4444', '#f59e0b', '#22c55e', '#22c55e'][passwordStrength];

  // Anti-bot Captcha
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(8);
  const [captchaInput, setCaptchaInput] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido para enviar el código.');
      return;
    }
    setError('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: 'register' }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
      } else {
        setError(data.error || 'Error al enviar el código');
      }
    } catch {
      setError('Error de conexión al enviar el código.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Anti-bot captcha check
    if (Number(captchaInput) !== num1 + num2) {
      setError('Respuesta Anti-bot incorrecta. Resuelve la suma para continuar.');
      generateCaptcha();
      return;
    }

    const targetCode = code.trim();
    if (!targetCode) {
      setError('Ingresa el código de verificación enviado a tu correo.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          code: targetCode,
          captchaAnswer: captchaInput,
          captchaExpected: num1 + num2,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('¡Cuenta registrada exitosamente! Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.error || 'Error al procesar el registro.');
        generateCaptcha();
      }
    } catch {
      setError('Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#090d16] text-white font-sans selection:bg-red-600 selection:text-white">
      {/* ═══════════════ IZQUIERDA: PANEL VISUAL ROJO Y NEGRO CON LOGO DE MARCA ═══════════════ */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-gray-800/80 bg-gradient-to-br from-[#000000] via-[#090d16] to-[#1a0505]">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo de Marca */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-12 w-auto" />
          <div className="border-l border-gray-800 pl-3">
            <h2 className="font-extrabold text-lg tracking-tight text-white">E-STORE PLATFORM</h2>
            <p className="text-xs text-red-500 font-semibold uppercase tracking-wider">Crear Cuenta de Cliente</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} /> Registro Protegido Anti-Bot
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Crea tu cuenta de <span className="text-red-600">Comerciante</span> y lanza tu Tienda Virtual.
          </h1>

          <p className="text-sm text-gray-400 leading-relaxed">
            Al registrarte obtendrás acceso inmediato a tu panel para cargar tu catálogo de productos, gestionar tus pedidos y conectarte por WhatsApp.
          </p>

          <div className="p-4 rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
              <CheckCircle2 size={16} className="text-red-500" />
              <span>Verificación Real de Correo Electrónico mediante Código OTP</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-500 border-t border-gray-800/80 pt-4">
          <span>© 2026 Plataforma de Tiendas Virtuales</span>
        </div>
      </div>

      {/* ═══════════════ DERECHA: FORMULARIO DE REGISTRO ═══════════════ */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#090d16] relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          
          <div className="flex items-center gap-3">
            <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-10 w-auto" />
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Crear Nueva Cuenta</h2>
              <p className="text-xs text-gray-400">Completa tus datos para registrarte como cliente</p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/30 text-red-400 text-xs flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 text-xs flex items-center gap-3">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu Nombre o Razón Social"
                  className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
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
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="px-3.5 h-11 bg-gray-900 border border-gray-800 hover:border-red-600 text-xs font-bold text-red-500 rounded-xl transition-all shrink-0 disabled:opacity-50"
                >
                  {sendingCode ? 'Enviando...' : codeSent ? 'Reenviar Código' : 'Enviar Código'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Código de Verificación del Correo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <KeyRound size={16} />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ingresa el código de 6 dígitos"
                  className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 font-mono tracking-wider focus:outline-none focus:border-red-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
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
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= passwordStrength ? strengthColor : 'rgba(128,128,128,0.25)' }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: strengthColor }}>
                    <Zap size={10} />
                    {strengthLabel}
                    {passwordStrength < 3 && ' · usa mayúsculas, números y símbolos'}
                  </p>
                </div>
              )}
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
                  title="Cambiar problema"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Resultado de la suma"
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
                  Registrando...
                </span>
              ) : (
                <>
                  <span>Crear Mi Cuenta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-800/80 text-center">
            <p className="text-xs text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-red-500 hover:underline font-bold">
                Inicia sesión aquí
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
