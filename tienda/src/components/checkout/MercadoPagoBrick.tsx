'use client';

import { useEffect, useRef, useState } from 'react';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoBrickProps {
  amount: number;
  onSubmit: (params: any) => void;
  onError?: (error: any) => void;
}

export default function MercadoPagoBrick({ amount, onSubmit, onError }: MercadoPagoBrickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let brickInstance: any = null;

    (async () => {
      try {
        console.log('[Brick] Starting... amount:', amount, 'key:', MP_PUBLIC_KEY?.substring(0, 10) + '...');

        // Load SDK
        if (!window.MercadoPago) {
          console.log('[Brick] Loading SDK from CDN...');
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
            if (existing) {
              console.log('[Brick] SDK script already in DOM');
              if ((window as any).MercadoPago) { resolve(); return; }
              existing.addEventListener('load', () => resolve());
              existing.addEventListener('error', () => reject(new Error('Script load error')));
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://sdk.mercadopago.com/js/v2';
            script.onload = () => {
              console.log('[Brick] SDK script loaded');
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load MP SDK from CDN'));
            document.head.appendChild(script);
          });
        } else {
          console.log('[Brick] SDK already on window');
        }

        if (cancelled) return;

        // Wait a tick for DOM
        await new Promise(r => setTimeout(r, 100));
        if (cancelled || !containerRef.current) {
          console.log('[Brick] Container not available');
          return;
        }

        console.log('[Brick] Creating MercadoPago instance...');
        const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });

        console.log('[Brick] Creating cardPayment brick...');
        brickInstance = mp.bricks().create('cardPayment', containerRef.current, {
          initialization: {
            amount,
          },
          onSubmit: async (params: any) => {
            console.log('[Brick] onSubmit called:', params);
            onSubmit(params);
          },
          onError: (error: any) => {
            console.error('[Brick] Brick error:', error);
            if (!cancelled) setError(error?.message || 'Error en el formulario de pago');
            onError?.(error);
          },
        });

        console.log('[Brick] Brick created successfully');
      } catch (err: any) {
        console.error('[Brick] Fatal error:', err);
        if (!cancelled) setError(err?.message || 'Error al cargar MercadoPago');
        onError?.(err);
      }
    })();

    return () => {
      cancelled = true;
      if (brickInstance) {
        try { brickInstance.unmount(); } catch {}
      }
    };
  }, []);

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <p className="text-xs text-gray-400">Verifica la consola del navegador para mas detalles.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} id="mp-card-payment" style={{ minHeight: 300 }} />
  );
}
