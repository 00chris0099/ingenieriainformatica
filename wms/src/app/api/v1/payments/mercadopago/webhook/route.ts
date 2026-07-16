import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

/**
 * RF-13: Auto stock deduction after successful payment
 * This webhook is called by MercadoPago when a payment is processed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

      // Determine order ID from external_reference
      const orderId: string | undefined = paymentData?.external_reference ?? body.external_reference ?? undefined;

      if (!orderId) {
        console.log(`[MP Webhook] No order ID found for payment ${paymentId}`);
        return apiSuccess({ received: true });
      }

      // Fetch the order with items
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        console.log(`[MP Webhook] Order ${orderId} not found`);
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
            status: order.status === 'pending' ? 'confirmed' : order.status,
          },
        });

        // RF-13: Deduct stock from product for each item
        for (const item of order.items) {
          if (!item.productId) continue;

          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            const newStock = Math.max(0, (product.stock || 0) - item.quantity);

            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: newStock },
            });

            console.log(`[RF-13] Stock deducted: ${item.sku} x${item.quantity} (was ${product.stock}, now ${newStock})`);
          }
        }

        // Invalidate cache
        await invalidateCache('products:*');
        await invalidateCache('orders');

        console.log(`[MP Webhook] Payment ${paymentId} approved for order ${order.orderNumber}`);
      } else {
        console.log(`[MP Webhook] Payment ${paymentId} not approved: ${paymentData?.status}`);
      }
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error, 'mercadopago-webhook');
  }
}

export async function GET(request: NextRequest) {
  return apiSuccess({ received: true });
}
