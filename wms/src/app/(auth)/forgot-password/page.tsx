'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, KeyRound, ShieldCheck, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');

  // Anti-bot Captcha
  const [num1, setNum1] = useState(4);
  const [num2, setNum2] = useState(9);
  const [captchaInput, setCaptchaInput] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [devCodeMsg, setDevCodeMsg] = useState('');
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
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setError('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/v1/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: 'recovery' }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSent(true);
        if (data.devCode) {
          setDevCodeMsg(`Código de recuperación: ${data.devCode}`);
        }
      } else {
        setError(data.error || 'Error al enviar el código');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (Number(captchaInput) !== num1 + num2) {
      setError('Respuesta Anti-bot incorrecta.');
      generateCaptcha();
      return;
    }

    if (!code.trim()) {
      setError('Coloca el código de verificación enviado a tu correo.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          newPassword,
          code,
          captchaAnswer: captchaInput,
          captchaExpected: num1 + num2,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Contraseña actualizada con éxito. Redirigiendo al inicio de sesión...');
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
      {/* Ambient Red Glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#090d16] border border-gray-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="flex items-center gap-3">
          <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-10 w-auto" />
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Recuperar Contraseña</h2>
            <p className="text-xs text-gray-400">Verificación de seguridad por correo</p>
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

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Correo Registrado
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
                {sendingCode ? 'Enviando...' : codeSent ? 'Reenviar' : 'Enviar Código'}
              </button>
            </div>
            {devCodeMsg && (
              <p className="text-xs font-mono text-emerald-400 font-bold mt-1.5 bg-black/40 p-2 rounded border border-emerald-500/20">
                {devCodeMsg}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
              Código de Verificación
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
                placeholder="123456"
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 font-mono tracking-wider focus:outline-none focus:border-red-600"
                required
              />
            </div>
          </div>

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
                className="w-full h-11 pl-10 pr-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-600"
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
                Restableciendo...
              </span>
            ) : (
              <>
                <span>Actualizar Contraseña</span>
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
