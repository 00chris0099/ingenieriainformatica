'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MercadoPagoBrick from '@/components/checkout/MercadoPagoBrick';

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';

type PaymentStep = 'form' | 'processing' | 'success' | 'error';

function PagoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const orderNumber = searchParams.get('orderNumber');

  const [step, setStep] = useState<PaymentStep>('form');
  const [paymentId, setPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleBrickSubmit = async (params: any) => {
    setStep('processing');
    try {
      const res = await fetch('/api/v1/payments/mercadopago/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          token: params.token,
          paymentMethodId: params.payment_method_id,
          installments: params.installments,
          identificationType: params.identification?.type,
          identificationNumber: params.identification?.number,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymentId(data.data.paymentId);
        setStep('success');
      } else {
        setErrorMessage(data.message || 'Error al procesar el pago');
        setStep('error');
      }
    } catch {
      setErrorMessage('Error de conexion. Intenta de nuevo.');
      setStep('error');
    }
  };

  if (!orderId || !amount) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <XCircle size={48} className="text-red-400 mb-4" />
          <h1 className="text-xl font-bold mb-2">Parametros invalidos</h1>
          <p className="text-gray-500 mb-6">Falta informacion del pedido.</p>
          <Link href="/tienda" className="bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-green-700">Ir a la tienda</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!MP_PUBLIC_KEY) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <XCircle size={48} className="text-red-400 mb-4" />
          <h1 className="text-xl font-bold mb-2">MercadoPago no configurado</h1>
          <p className="text-gray-500 mb-6">Falta la llave publica.</p>
          <Link href="/tienda" className="bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-green-700">Ir a la tienda</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} />
          <span className="text-sm">Volver</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pagar con MercadoPago</h1>
                <p className="text-sm text-gray-500">
                  Pedido {orderNumber || ''} — S/ {Number(amount).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {step === 'form' && (
              <MercadoPagoBrick amount={Number(amount)} onSubmit={handleBrickSubmit} />
            )}

            {step === 'processing' && (
              <div className="py-16 text-center">
                <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-700">Procesando tu pago...</p>
                <p className="text-xs text-gray-400 mt-1">No cierres esta ventana</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Pago aprobado</h2>
                <p className="text-sm text-gray-500 mb-1">Tu pago fue procesado exitosamente</p>
                <p className="text-xs text-gray-400 mb-6">ID de pago: {paymentId}</p>
                <Link href={`/pedido?n=${orderNumber || ''}`} className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  Ver mi pedido
                </Link>
              </div>
            )}

            {step === 'error' && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={32} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Pago no completado</h2>
                <p className="text-sm text-red-500 mb-6">{errorMessage}</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setStep('form'); setErrorMessage(''); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Intentar de nuevo
                  </button>
                  <Link href={`/pedido?n=${orderNumber || ''}`} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    Ver mi pedido
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-green-600" />
        </main>
        <Footer />
      </div>
    }>
      <PagoInner />
    </Suspense>
  );
}
