'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Percent } from 'lucide-react';

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    // Check if already shown this session
    if (sessionStorage.getItem('exit-popup-shown')) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem('exit-popup-shown')) {
        setVisible(true);
        sessionStorage.setItem('exit-popup-shown', '1');
      }
    };

    // Generate random discount code
    const codes = ['ADRI5', 'BEBE5', 'KIDS5', 'AMOR5', 'DESCUENTO5'];
    setDiscountCode(codes[Math.floor(Math.random() * codes.length)]);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [mounted]);

  const close = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem('exit-popup-shown', '1');
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className={`relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl transition-transform duration-300 ${visible ? 'scale-100' : 'scale-95'}`}>
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Percent size={32} className="text-green-600" />
        </div>

        <h2 className="text-xl font-bold mb-2">Espera! No te vayas</h2>
        <p className="text-gray-500 mb-4">Tenemos algo especial para ti</p>

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Obten</p>
          <p className="text-3xl font-extrabold text-green-600">5% de descuento</p>
          <p className="text-xs text-gray-500 mt-1">En tu compra de hoy</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-6">
          <p className="text-xs text-gray-400 mb-1">Tu codigo de descuento:</p>
          <p className="text-xl font-bold text-green-600 tracking-wider">{discountCode}</p>
        </div>

        <button onClick={close}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          Quiero mi descuento
        </button>
        <button onClick={close} className="mt-2 text-sm text-gray-400 hover:text-gray-600">
          No gracias
        </button>
      </div>
    </div>
  );
}
