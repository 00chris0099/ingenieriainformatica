import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { currencySymbol } from '@/lib/payments/checkout';

/**
 * GET /api/v1/store/orders/[orderNumber] — public order status.
 * Used by /pedido/[orderNumber] (and the checkout confirmation overlay) to
 * poll the payment status after a MercadoPago redirect.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber) return apiError('orderNumber requerido', 400);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return apiError('Pedido no encontrado', 404);

    // Never leak internal fields (internalNotes) through this public endpoint.
    return apiSuccess({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      symbol: currencySymbol(order.currency),
      subtotal: Number(order.subtotal),
      shippingAmount: Number(order.shippingAmount),
      total: Number(order.total),
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      items: order.items.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        total: Number(it.total),
      })),
    });
  } catch (error) {
    console.error('[store/orders/[orderNumber]]:', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al consultar el pedido', 500);
  }
}
