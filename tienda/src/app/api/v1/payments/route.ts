import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency, method } = body;

    if (!orderId || !amount || !method) {
      return apiError('orderId, amount, and method are required', 400);
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return apiError('Order not found', 404);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        method,
        status: method === 'yape' || method === 'plin' ? 'pending' : 'pending',
        amount,
        currency: currency || 'PEN',
      },
    });

    // Generate QR data for Yape/Plin
    let qrData = null;
    if (method === 'yape' || method === 'plin') {
      qrData = {
        type: method,
        phone: '+51-999-111-222', // Business phone
        amount,
        message: `Pedido ${order.orderNumber}`,
      };
    }

    return apiSuccess({
      paymentId: payment.id,
      method,
      status: payment.status,
      qrData,
      instructions: method === 'yape' || method === 'plin'
        ? `Escanea el codigo QR con tu app ${method.toUpperCase()} y envia el comprobante por WhatsApp`
        : `Seras redirigido a la pasarela de pago`,
    }, 201);
  } catch (error) {
    return handleApiError(error, 'tienda-payment-create');
  }
}
