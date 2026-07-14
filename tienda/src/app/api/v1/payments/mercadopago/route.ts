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
    console.log('[MP] Access Token available:', !!MP_ACCESS_TOKEN);

    if (!MP_ACCESS_TOKEN) {
      console.error('[MP] MERCADOPAGO_ACCESS_TOKEN no esta configurado');
      return apiError('MercadoPago no esta configurado en el servidor', 500);
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

    const mpRequestBody = {
      items: [{
        title: `Pedido ${order.orderNumber}`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: currency || 'PEN',
      }],
      external_reference: orderId,
      back_urls: {
        success: `${baseUrl}/pedido?n=${order.orderNumber}`,
        failure: `${baseUrl}/pedido?n=${order.orderNumber}`,
        pending: `${baseUrl}/pedido?n=${order.orderNumber}`,
      },
      ...(process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')
        ? { notification_url: `${process.env.NEXTAUTH_URL}/api/v1/payments/mercadopago/webhook` }
        : {}),
    };

    console.log('[MP] Request to MercadoPago API:', JSON.stringify(mpRequestBody, null, 2));

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(mpRequestBody),
    });

    console.log('[MP] Response status:', response.status);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      console.error('[MP] Error response:', JSON.stringify(errorData, null, 2));
      return apiError(`MercadoPago API error: ${errorData.message || errorData.error || response.statusText}`, response.status);
    }

    const preference = await response.json();
    console.log('[MP] Preference created:', JSON.stringify(preference, null, 2));

    return apiSuccess({
      preferenceId: preference.id,
      checkoutUrl: preference.init_point,
      sandboxUrl: preference.sandbox_init_point,
    });
  } catch (error) {
    console.error('[MP] Exception:', error);
    return handleApiError(error, 'tienda-mercadopago');
  }
}
