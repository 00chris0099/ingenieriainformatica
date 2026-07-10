'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

const NAMES = ['Maria', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Claudia', 'Pedro', 'Sofia', 'Miguel', 'Elena', 'Fernando', 'Patricia', 'Roberto', 'Diana', 'Andres', 'Carmen', 'Juan', 'Laura', 'Ricardo'];
const CITIES = ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Piura', 'Chiclayo', 'Ica', 'Huancayo', 'Cajamarca', 'Puno'];
const TIME_OPTIONS = ['hace 2 min', 'hace 5 min', 'hace 8 min', 'hace 12 min', 'hace 18 min', 'hace 25 min'];

function getTimeAgo(): string {
  return TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)];
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function SocialProofToast({ productName }: { productName?: string }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [person, setPerson] = useState({ name: '', city: '' });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !productName) return;

    setPerson({ name: randomFrom(NAMES), city: randomFrom(CITIES) });

    const showTimer = setInterval(() => {
      setPerson({ name: randomFrom(NAMES), city: randomFrom(CITIES) });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }, 30000);

    const firstTimer = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }, 5000);

    return () => { clearInterval(showTimer); clearTimeout(firstTimer); };
  }, [mounted, productName]);

  if (!mounted || !productName) return null;

  return (
    <div className={`fixed top-3 left-3 md:bottom-4 md:left-4 md:top-auto z-50 transition-all duration-500 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 md:translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex items-center gap-3 max-w-xs">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <ShoppingCart size={14} className="text-green-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">{person.name}</span> de {person.city} compro
          </p>
          <p className="text-xs text-green-600 font-medium truncate">{productName}</p>
          <p className="text-[10px] text-gray-400">{getTimeAgo()}</p>
        </div>
      </div>
    </div>
  );
}
