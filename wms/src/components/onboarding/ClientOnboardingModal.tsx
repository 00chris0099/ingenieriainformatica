'use client';

import { useState, useEffect } from 'react';
import {
  Shirt,
  Smartphone,
  Home,
  Utensils,
  Briefcase,
  Sparkles,
  Package,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Share2,
  Boxes,
  ShoppingBag,
  Bot,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  userName: string;
  onComplete: (data: any) => void;
}

export default function ClientOnboardingModal({ userName, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [formData, setFormData] = useState({
    businessType: 'Moda',
    businessName: '',
    country: 'Perú',
    referralSource: 'Google',
    productCount: '2–20',
    salesChannel: 'Ambos',
    aiChatbot: 'Sí',
    hasLogo: 'Lo subiré después',
  });

  const businessTypes = [
    { id: 'Moda', label: 'Moda', icon: Shirt },
    { id: 'Tecnología', label: 'Tecnología', icon: Smartphone },
    { id: 'Hogar', label: 'Hogar', icon: Home },
    { id: 'Alimentos', label: 'Alimentos', icon: Utensils },
    { id: 'Servicios', label: 'Servicios', icon: Briefcase },
    { id: 'Monoproducto', label: 'Monoproducto', icon: Sparkles },
    { id: 'Otro', label: 'Otro', icon: Package },
  ];

  const countries = ['Perú', 'Colombia', 'México', 'Chile', 'Ecuador', 'Argentina', 'España', 'Estados Unidos', 'Otro'];

  const referralSources = [
    'Google',
    'Facebook',
    'Instagram',
    'TikTok',
    'YouTube',
    'WhatsApp',
    'Recomendación',
    'ChatGPT',
    'Otro',
  ];

  const productCounts = ['1', '2–20', '21–100', 'Más de 100'];

  const salesChannels = ['Solo WhatsApp', 'Tienda Online', 'Ambos'];

  const aiChatbotOptions = ['Sí', 'No por ahora'];

  const logoOptions = ['Sí', 'Lo subiré después', 'No tengo'];

  // Handle auto-progress during creation step 3
  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onComplete(formData);
            }, 600);
            return 100;
          }
          return prev + 25;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
    try {
      await fetch('/api/v1/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-white flex flex-col justify-between overflow-y-auto font-sans selection:bg-red-600 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-4xl mx-auto p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img src="/images/brand-logo.svg" alt="Brand Logo" className="h-9 w-auto" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Configuración Inicial</span>
        </div>

        {step !== 3 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Paso {step} de 2</span>
            <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Wizard Form Container */}
      <div className="w-full max-w-3xl mx-auto px-6 py-4 flex-1 flex flex-col justify-center relative z-10">
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Cuéntanos sobre tu negocio
              </h1>
              <p className="text-sm text-gray-400">Paso 1 de 2</p>
            </div>

            {/* 1. Tipo de negocio */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                1. ¿Qué tipo de negocio tienes?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {businessTypes.map((item) => {
                  const selected = formData.businessType === item.id;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFormData({ ...formData, businessType: item.id })}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white shadow-lg shadow-red-600/10'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      <Icon size={20} className={selected ? 'text-red-500' : 'text-gray-400'} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Nombre del negocio */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                2. ¿Cómo se llama tu negocio?
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Nombre de tu tienda o marca"
                className="w-full h-12 px-4 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-600 transition-all"
                required
              />
            </div>

            {/* 3. País de venta */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Globe size={14} className="text-red-500" />
                3. ¿En qué país venderás?
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {countries.map((c) => {
                  const selected = formData.country === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, country: c })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. ¿Cómo nos conociste? */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Share2 size={14} className="text-red-500" />
                4. ¿Cómo nos conociste?
              </label>
              <div className="flex flex-wrap gap-2">
                {referralSources.map((source) => {
                  const selected = formData.referralSource === source;
                  return (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setFormData({ ...formData, referralSource: source })}
                      className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {source}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón Siguiente */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
              >
                <span>Continuar</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Detalles de operación
              </h1>
              <p className="text-sm text-gray-400">Paso 2 de 2</p>
            </div>

            {/* 5. Cantidad de productos */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Boxes size={14} className="text-red-500" />
                5. ¿Cuántos productos tendrás al iniciar?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {productCounts.map((count) => {
                  const selected = formData.productCount === count;
                  return (
                    <div
                      key={count}
                      onClick={() => setFormData({ ...formData, productCount: count })}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. ¿Cómo venderás? */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag size={14} className="text-red-500" />
                6. ¿Cómo venderás?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {salesChannels.map((channel) => {
                  const selected = formData.salesChannel === channel;
                  return (
                    <div
                      key={channel}
                      onClick={() => setFormData({ ...formData, salesChannel: channel })}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {channel}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Chatbot con IA */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Bot size={14} className="text-red-500" />
                7. ¿Quieres un chatbot con IA?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {aiChatbotOptions.map((opt) => {
                  const selected = formData.aiChatbot === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => setFormData({ ...formData, aiChatbot: opt })}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 8. ¿Ya tienes un logo? */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} className="text-red-500" />
                8. ¿Ya tienes un logo?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {logoOptions.map((opt) => {
                  const selected = formData.hasLogo === opt;
                  return (
                    <div
                      key={opt}
                      onClick={() => setFormData({ ...formData, hasLogo: opt })}
                      className={`p-3.5 rounded-xl border cursor-pointer text-center text-xs font-bold transition-all ${
                        selected
                          ? 'border-red-600 bg-red-600/10 text-white'
                          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700 text-gray-400'
                      }`}
                    >
                      {opt}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botones Navegación */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 px-4 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>

              <button
                type="submit"
                className="h-12 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
              >
                <span>Finalizar</span>
                <Check size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CREATING STORE SCREEN */}
        {step === 3 && (
          <div className="py-16 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto text-red-500">
              <Loader2 size={32} className="animate-spin" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Estamos creando tu tienda...
              </h2>
              <p className="text-xs text-gray-400">Configurando catálogo, canal de ventas y ajustes iniciales</p>
            </div>

            <div className="w-full max-w-xs mx-auto h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-4xl mx-auto p-6 text-center text-xs text-gray-500 border-t border-gray-800/80 relative z-10">
        © 2026 E-Store Platform
      </div>
    </div>
  );
}
