'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle, Loader2, MessageSquare, ShoppingBag, ArrowLeft } from 'lucide-react'

interface OrderItemView {
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface OrderView {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  currency: string
  symbol: string
  subtotal: number
  shippingAmount: number
  total: number
  placedAt: string | null
  confirmedAt: string | null
  items: OrderItemView[]
}

export default function OrderClient({
  initial,
  whatsappNumber,
  storeUrl,
}: {
  initial: OrderView
  whatsappNumber: string | null
  storeUrl: string
}) {
  const [order, setOrder] = useState<OrderView>(initial)
  const [loading, setLoading] = useState(false)

  // Poll while the payment is still pending (MercadoPago redirect flow)
  useEffect(() => {
    if (order.paymentStatus !== 'pending') return
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/store/orders/${order.orderNumber}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json?.data) {
            setOrder(json.data)
            setLoading(false)
          }
        }
      } catch {
        /* retry silently */
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [order.orderNumber, order.paymentStatus])

  const paid = order.paymentStatus === 'paid' || order.paymentStatus === 'captured' || order.paymentStatus === 'authorized'
  const failed = order.paymentStatus === 'failed' || order.paymentStatus === 'refunded' || order.paymentStatus === 'voided'

  const badge = paid ? (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-extrabold">
      <CheckCircle2 size={16} /> PAGADO
    </span>
  ) : failed ? (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-600 text-sm font-extrabold">
      <XCircle size={16} /> PAGO RECHAZADO
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-extrabold">
      <Clock size={16} /> PENDIENTE DE PAGO
    </span>
  )

  const whatsappLink =
    order.paymentMethod === 'whatsapp' && whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          `Hola! Quiero completar el pago de mi pedido ${order.orderNumber} (Total: ${order.symbol} ${order.total.toFixed(2)})`
        )}`
      : null

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <a href={storeUrl} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={16} /> Volver a la tienda
          </a>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">Confirmación de pedido</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-slate-900">Pedido {order.orderNumber}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {order.placedAt ? new Date(order.placedAt).toLocaleString('es-PE') : '—'}
              </p>
            </div>
            {badge}
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="space-y-3">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 truncate">{it.productName}</p>
                    <p className="text-xs text-slate-400">Cantidad: {it.quantity}</p>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {order.symbol} {(it.unitPrice * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{order.symbol} {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Envío</span>
                <span>{order.shippingAmount > 0 ? `${order.symbol} ${order.shippingAmount.toFixed(2)}` : 'GRATIS'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="font-black text-slate-900">Total</span>
                <span className="text-xl font-black text-slate-900">{order.symbol} {order.total.toFixed(2)}</span>
              </div>
            </div>

            {!paid && !failed && (
              <div className="pt-2">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-3">
                    <Loader2 size={14} className="animate-spin" /> Actualizando estado…
                  </div>
                ) : whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-extrabold text-sm transition-all"
                  >
                    <MessageSquare size={16} /> Confirmar pago por WhatsApp
                  </a>
                ) : (
                  <div className="text-center text-xs text-slate-400 py-3">
                    {order.paymentMethod === 'mercadopago'
                      ? 'Si ya realizaste el pago, la confirmación llega en unos minutos.'
                      : 'Recibirás la confirmación del vendedor por WhatsApp/email.'}
                  </div>
                )}
              </div>
            )}

            {paid && (
              <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <p className="text-sm font-bold text-emerald-700">
                  ¡Gracias por tu compra! Tu pedido está confirmado y en proceso.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          <ShoppingBag size={12} className="inline mr-1" />
          Impulsado por WMS Platform
        </p>
      </div>
    </main>
  )
}
