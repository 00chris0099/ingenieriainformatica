import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, token, paymentMethodId, installments, identificationType, identificationNumber } = body;

    if (!orderId || !token || !paymentMethodId) {
      return apiError('orderId, token, and paymentMethodId are required', 400);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return apiError('Order not found', 404);

    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) return apiError('MercadoPago no esta configurado', 500);

    const paymentBody = {
      transaction_amount: Number(order.total),
      token,
      description: `Pedido ${order.orderNumber}`,
      installments: installments || 1,
      payment_method_id: paymentMethodId,
      external_reference: orderId,
      payer: {
        email: (order as any).customer?.email || 'guest@adriskids.com',
        identification: identificationType && identificationNumber
          ? { type: identificationType, number: identificationNumber }
          : undefined,
      },
    };

    console.log('[MP Process] Creating payment for order:', order.orderNumber, 'amount:', order.total);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const payment = await response.json();
    console.log('[MP Process] Payment response status:', response.status, 'status:', payment.status);

    if (!response.ok) {
      console.error('[MP Process] Payment error:', JSON.stringify(payment, null, 2));
      return apiError(payment.message || 'Error al procesar pago', response.status);
    }

    const isApproved = payment.status === 'approved' || payment.status === 'authorized';

    if (isApproved) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      });

      const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
      for (const item of orderItems) {
        if (!item.productId) continue;
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: Math.max(0, product.stock - item.quantity),
            },
          });
        }
      }

      console.log('[MP Process] Payment approved for order:', order.orderNumber);
    }

    return apiSuccess({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
    });
  } catch (error) {
    console.error('[MP Process] Exception:', error);
    return handleApiError(error, 'mercadopago-process');
  }
}
