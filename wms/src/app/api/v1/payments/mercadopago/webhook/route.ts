import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';
import { getPayment, validateWebhookSignature } from '@/lib/payments/mercadopago';
import { trackGA4Event } from '@/lib/analytics-ga4';

/**
 * MercadoPago webhook — called by MP when a payment notification arrives.
 *
 * Security model:
 *  1. Validate the HMAC signature (x-signature) when a client secret is set.
 *  2. Never trust the payload: re-fetch the payment from MP with the token of
 *     the order's business (per-store owner account), falling back to env.
 *  3. Only act on approved/authorized payments; record a Payment row and
 *     update the order status + paymentStatus.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    if (body.type !== 'payment') {
      return apiSuccess({ received: true });
    }

    const paymentId = body?.data?.id;
    if (!paymentId) return apiError('Missing payment ID', 400);

    // 1. Signature validation (degraded mode when no secret configured)
    const isValidSignature = validateWebhookSignature(request.headers, body);
    if (!isValidSignature) {
      console.warn('[MP Webhook] Invalid signature rejected');
      return apiError('Invalid signature', 401);
    }

    // 2. Re-fetch the payment server-side. First try the order's business token.
    const mpPayment: any = await (async () => {
      try {
        // Try to find the order first (external_reference = order id) to use
        // its business-level token; otherwise fall back to the env token.
        const maybeOrder = await prisma.order.findFirst({
          where: { id: String(body?.external_reference || '') },
          select: { businessId: true },
        }).catch(() => null);

        let token: string | null = null;
        if (maybeOrder?.businessId) {
          const business = await prisma.business.findUnique({
            where: { id: maybeOrder.businessId },
            select: { settings: true },
          }).catch(() => null);
          const payments = (business?.settings as any)?.payments;
          const bizToken = payments?.mercadopago?.accessToken;
          if (typeof bizToken === 'string' && bizToken.trim()) token = bizToken.trim();
        }
        return await getPayment(String(paymentId), token);
      } catch (err) {
        console.error('[MP Webhook] Error fetching payment details:', (err as Error)?.message?.slice(0, 200));
        return null;
      }
    })();

    const orderId: string | undefined =
      mpPayment?.external_reference ?? body?.external_reference ?? body?.data?.external_reference ?? undefined;

    if (!orderId) {
      console.log(`[MP Webhook] No order ID for payment ${paymentId}`);
      return apiSuccess({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      console.log(`[MP Webhook] Order ${orderId} not found`);
      return apiSuccess({ received: true });
    }

    const status = String(mpPayment?.status || '');
    const approved = status === 'approved' || status === 'authorized' || status === 'captured';
    const rejected = status === 'rejected' || status === 'cancelled' || status === 'refunded' || status === 'charged_back';

    if (approved) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          status: order.status === 'pending' ? 'confirmed' : order.status,
          confirmedAt: order.confirmedAt || new Date(),
        },
      });

      // Record the payment (audit trail)
      await prisma.payment.create({
        data: {
          orderId,
          method: 'mercadopago',
          status: 'paid',
          amount: Number(mpPayment.transaction_amount ?? order.total),
          currency: order.currency,
          transactionId: String(paymentId),
          metadata: {
            status_detail: mpPayment.status_detail,
            payment_method_id: mpPayment.payment_method_id,
            payer: mpPayment.payer?.email || null,
          },
        },
      }).catch((e) => console.error('[MP Webhook] Payment record failed:', (e as Error)?.message?.slice(0, 200)));

      // RF-13: stock deduction (legacy — guarded; stores may ignore stock)
      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await prisma.product.findUnique({ where: { id: item.productId } }).catch(() => null);
        if (product) {
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          await prisma.product
            .update({ where: { id: item.productId }, data: { stock: newStock } })
            .catch(() => null);
        }
      }

      // GA4 Measurement Protocol: purchase (fire-and-forget, con la data real del pago)
      prisma.business
        .findUnique({ where: { id: order.businessId || '' } })
        .then((business) => {
          if (business) {
            trackGA4Event({
              business,
              eventName: 'purchase',
              userId: mpPayment?.payer?.email || undefined,
              params: {
                transaction_id: String(paymentId),
                value: Number(mpPayment.transaction_amount ?? order.total),
                currency: order.currency,
                items: order.items.map((it) => ({
                  item_id: it.sku,
                  item_name: it.productName,
                  quantity: it.quantity,
                  price: Number(it.unitPrice),
                })),
              },
            });
          }
        })
        .catch(() => {});

      await invalidateCache('products:*');
      await invalidateCache('orders:*');
      console.log(`[MP Webhook] Payment ${paymentId} approved for order ${order.orderNumber}`);
    } else if (rejected) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'failed' },
      });
      await prisma.payment
        .create({
          data: {
            orderId,
            method: 'mercadopago',
            status: 'failed',
            amount: Number(mpPayment.transaction_amount ?? order.total),
            currency: order.currency,
            transactionId: String(paymentId),
            metadata: { status_detail: mpPayment.status_detail, payment_method_id: mpPayment.payment_method_id },
          },
        })
        .catch(() => null);
      console.log(`[MP Webhook] Payment ${paymentId} rejected for order ${order.orderNumber}`);
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error, 'mercadopago-webhook');
  }
}

export async function GET() {
  // MP validation ping
  return apiSuccess({ received: true });
}
