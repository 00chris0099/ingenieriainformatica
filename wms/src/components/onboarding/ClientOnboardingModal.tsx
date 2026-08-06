'use client';

import { useState } from 'react';
import { Store, ShoppingBag, CreditCard, MessageSquare, Check, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  userName: string;
  onComplete: (data: any) => void;
}

export default function ClientOnboardingModal({ userName, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessType: 'moda',
    estimatedProducts: '10-50',
    checkoutPreference: 'whatsapp',
    whatsappNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const businessTypes = [
    { id: 'moda', label: 'Moda & Ropa Infantil', icon: Store, desc: 'Catálogo de prendas, tallas y variantes de color' },
    { id: 'tech', label: 'Tecnología & Electrónica', icon: ShoppingBag, desc: 'Productos tech, gadgets y accesorios' },
    { id: 'monoproducto', label: 'Monoproducto / Oferta Flash', icon: Sparkles, desc: 'Venta masiva de 1 producto estrella con alta conversión' },
    { id: 'servicios', label: 'Servicios & Cursos', icon: MessageSquare, desc: 'Reservas, consultas y asesorías digitales' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/v1/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {}
    setSubmitting(false);
    onComplete(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#090d16] border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl text-gray-100 relative overflow-hidden">
        {/* Decorative Ambient Red Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 font-bold flex items-center justify-center text-sm border border-red-500/20">
              {step}/2
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Precalificación de Negocio
            </span>
          </div>
          <span className="text-xs text-red-500 font-bold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
            Paso {step} de 2
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  ¡Bienvenido, {userName}! 👋
                </h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">
                  Cuéntanos un poco sobre tu proyecto para personalizar tu tienda virtual.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  1. ¿Qué tipo de negocio o nicho tienes?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businessTypes.map((item) => {
                    const selected = formData.businessType === item.id;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setFormData({ ...formData, businessType: item.id })}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-red-600 bg-red-600/10 shadow-lg shadow-red-600/10'
                            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon size={18} className={selected ? 'text-red-500' : 'text-gray-400'} />
                          {selected && <Check size={14} className="text-red-500" />}
                        </div>
                        <p className="font-bold text-xs text-gray-200">{item.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/20"
                >
                  <span>Siguiente Paso</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Preferencia de Pedidos & WhatsApp
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Configura cómo deseas recibir las compras de tus clientes.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    2. Número de WhatsApp para recibir Pedidos
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="Ej: +51 999 111 222"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    3. ¿Cuántos productos estimas subir inicialmente?
                  </label>
                  <select
                    value={formData.estimatedProducts}
                    onChange={(e) => setFormData({ ...formData, estimatedProducts: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-600"
                  >
                    <option value="1-10">1 a 10 productos (Catálogo inicial)</option>
                    <option value="10-50">10 a 50 productos (Mediano)</option>
                    <option value="50-200">50 a 200 productos (Extenso)</option>
                    <option value="200+">Más de 200 productos</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Comenzar a Administrar Mi Tienda'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
