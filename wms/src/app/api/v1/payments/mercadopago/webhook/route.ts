import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

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
      const orderId = paymentData?.external_reference || body.external_reference;

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
            status: order.status === 'draft' ? 'confirmed' : order.status,
          },
        });

        // RF-13: Deduct stock from inventory for each item
        for (const item of order.items) {
          // Find inventory record for this variant in the order's warehouse
          const inventory = await prisma.inventory.findFirst({
            where: {
              variantId: item.variantId,
              warehouseId: order.warehouseId || undefined,
            },
          });

          if (inventory) {
            // Calculate new quantities
            const newQuantity = Math.max(0, inventory.quantity - item.quantity);
            const newReserved = Math.max(0, inventory.reservedQuantity - item.quantity);
            const newAvailable = Math.max(0, inventory.availableQuantity - item.quantity);

            // Update inventory
            await prisma.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: newQuantity,
                reservedQuantity: newReserved,
                availableQuantity: newAvailable,
              },
            });

            console.log(`[RF-13] Stock deducted: ${item.sku} x${item.quantity} (was ${inventory.quantity}, now ${newQuantity})`);
          }
        }

        // Invalidate cache
        await invalidateCache('inventory');
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
