import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency } = body;

    if (!orderId || !amount) return apiError('orderId and amount required', 400);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return apiError('Order not found', 404);

    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      // Mock mode
      return apiSuccess({
        preferenceId: `MP-${Date.now()}`,
        checkoutUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/pedido/${order.orderNumber}`,
        sandboxUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/pedido/${order.orderNumber}`,
      });
    }

    const response = await fetch('https://api.mercadopago.com/v1/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          title: `Pedido ${order.orderNumber}`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: currency || 'PEN',
        }],
        external_reference: orderId,
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/pedido/${order.orderNumber}`,
          failure: `${process.env.NEXTAUTH_URL}/pedido/${order.orderNumber}`,
          pending: `${process.env.NEXTAUTH_URL}/pedido/${order.orderNumber}`,
        },
        auto_return: 'approved',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return apiError(error.message || 'Failed to create preference', 500);
    }

    const preference = await response.json();
    return apiSuccess({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
    });
  } catch (error) {
    return handleApiError(error, 'tienda-mercadopago');
  }
}
