import { notFound } from 'next/navigation'
import { prisma } from '@repo/prisma'
import { currencySymbol } from '@/lib/payments/checkout'
import OrderClient from './order-client'

/**
 * /pedido/[orderNumber] — public order confirmation page.
 * Served as the MercadoPago back_url target (success/failure/pending) and as
 * the storefront order status page. SSR renders the initial state; the client
 * polls the public API while the payment is pending.
 */
export default async function PedidoPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params

  const order = await prisma.order
    .findUnique({
      where: { orderNumber },
      include: { items: true, business: { select: { id: true, settings: true, pages: { where: { status: 'published' }, select: { id: true }, take: 1 } } } },
    })
    .catch(() => null)

  if (!order) notFound()

  const symbol = currencySymbol(order.currency)
  const bizSettings: any = order.business?.settings && typeof order.business.settings === 'object' ? order.business.settings : {}
  const whatsappNumber: string | null = bizSettings.whatsappNumber || null

  const storePageId = order.business?.pages?.[0]?.id
  const baseUrl = (process.env.WMS_URL || process.env.NEXTAUTH_URL || '').replace(/\/+$/, '')
  const storeUrl = storePageId ? `${baseUrl}/p/${storePageId}` : baseUrl || '/'

  const initial = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    symbol,
    subtotal: Number(order.subtotal),
    shippingAmount: Number(order.shippingAmount),
    total: Number(order.total),
    placedAt: order.placedAt ? order.placedAt.toISOString() : null,
    confirmedAt: order.confirmedAt ? order.confirmedAt.toISOString() : null,
    items: order.items.map((it) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
  }

  return (
    <>
      <title>{`Pedido ${order.orderNumber} — Estado`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <OrderClient initial={initial} whatsappNumber={whatsappNumber} storeUrl={storeUrl} />
    </>
  )
}
