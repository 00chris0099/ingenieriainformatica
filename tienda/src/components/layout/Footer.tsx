'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="AdriSu Kids" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-gray-400">Muebles para bebes de calidad premium.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Tienda</h4>
            <div className="space-y-2 text-sm">
              <Link href="/tienda" className="block hover:text-white">Todos los productos</Link>
              <Link href="/tienda?categoria=camas-cunas" className="block hover:text-white">Camas y Cunas</Link>
              <Link href="/tienda?categoria=sillas-altas" className="block hover:text-white">Sillas Altas</Link>
              <Link href="/tienda?categoria=carritos" className="block hover:text-white">Carritos</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Ayuda</h4>
            <div className="space-y-2 text-sm">
              <Link href="/faq" className="block hover:text-white">Preguntas frecuentes</Link>
              <span className="block">Envios a todo el Peru</span>
              <span className="block">Devoluciones en 30 dias</span>
              <span className="block">Pagos seguros</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-3">Recibe ofertas y novedades</p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={16} /> Suscrito!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          2026 AdriSu Kids. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
