import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import crypto from 'crypto';

/**
 * RF-13: Tienda webhook for MercadoPago payment notifications
 * This endpoint receives payment confirmations and triggers stock deduction
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-signature');
      if (!signature) return apiError('Missing webhook signature', 401);

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[MP Webhook] Invalid signature');
        return apiError('Invalid signature', 401);
      }
    }

    const body = JSON.parse(rawBody);
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) return apiError('Missing payment ID', 400);

      // Fetch payment details from MercadoPago API
      const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
      let paymentData: any = null;

      if (MP_ACCESS_TOKEN) {
        try {
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
          });
          if (mpResponse.ok) {
            paymentData = await mpResponse.json();
          }
        } catch (err) {
          console.error('[MP Webhook] Error fetching payment details:', err);
        }
      }

      // Get order ID from external_reference
      const orderId = paymentData?.external_reference || body.external_reference;

      if (!orderId) {
        console.log(`[MP Webhook Tienda] No order ID for payment ${paymentId}`);
        return apiSuccess({ received: true });
      }

      // Fetch the order with items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        console.log(`[MP Webhook Tienda] Order ${orderId} not found`);
        return apiSuccess({ received: true });
      }

      // Check if payment is approved
      const isApproved = paymentData?.status === 'approved' || paymentData?.status === 'authorized';

      if (isApproved) {
        // Update order payment status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            status: order.status === 'draft' ? 'confirmed' : order.status,
          },
        });

        // RF-13: Deduct stock from inventory for each item
        for (const item of order.items) {
          const inventory = await prisma.inventory.findFirst({
            where: { variantId: item.variantId },
          });

          if (inventory) {
            const newQuantity = Math.max(0, inventory.quantity - item.quantity);
            const newReserved = Math.max(0, inventory.reservedQuantity - item.quantity);
            const newAvailable = Math.max(0, inventory.availableQuantity - item.quantity);

            await prisma.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: newQuantity,
                reservedQuantity: newReserved,
                availableQuantity: newAvailable,
              },
            });

            console.log(`[RF-13 Tienda] Stock deducted: ${item.sku} x${item.quantity}`);
          }
        }

        console.log(`[MP Webhook Tienda] Payment ${paymentId} approved for order ${order.orderNumber}`);
      } else {
        console.log(`[MP Webhook Tienda] Payment ${paymentId} not approved: ${paymentData?.status}`);
      }
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error, 'mercadopago-webhook-tienda');
  }
}

export async function GET(request: NextRequest) {
  return apiSuccess({ received: true });
}
