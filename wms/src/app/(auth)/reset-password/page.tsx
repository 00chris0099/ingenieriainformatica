'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Anti-bot Captcha
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(3);
  const [captchaInput, setCaptchaInput] = useState('');

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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (Number(captchaInput) !== num1 + num2) {
      setError('Respuesta Anti-bot incorrecta.');
      generateCaptcha();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword,
          captchaAnswer: captchaInput,
          captchaExpected: num1 + num2,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        setError(data.error || 'Error al restablecer la contraseña.');
        generateCaptcha();
      }
    } catch {
      setError('Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] text-white p-6 relative selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-md bg-[#090d16] border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-10 w-auto" />
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Establecer Nueva Contraseña</h2>
            <p className="text-xs text-gray-400">Para la cuenta {email ? <span className="text-red-500 font-bold">{email}</span> : ''}</p>
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

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-600 transition-all"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-600 transition-all"
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
                title="Cambiar suma"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            <input
              type="number"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Resultado"
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
                Guardando...
              </span>
            ) : (
              <>
                <span>Guardar Nueva Contraseña</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link href="/login" className="text-xs text-gray-400 hover:text-white font-semibold">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#090d16] text-gray-400 text-sm">Cargando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
