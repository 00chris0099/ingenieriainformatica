import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { createPreference } from '@/lib/payments/mercadopago';
import { notifyOrderCreated } from '@/lib/notifications/orders';
import { trackGA4Event } from '@/lib/analytics-ga4';
import {
  pageProductMap,
  parsePrice,
  generateOrderNumber,
  resolvePaymentConfig,
  buildWhatsappOrderUrl,
  currencySymbol,
} from '@/lib/payments/checkout';
import { markCartConverted } from '@/lib/carts';

/**
 * POST /api/v1/store/orders — public checkout for a published page.
 *
 * The storefront catalog is embedded in the published page blocks, so the
 * server re-resolves every product and price from the PAGE CONTENT (never
 * trusts the client). The order inherits the page's business (multi-tenant).
 *
 * Body: {
 *   pageId: string,
 *   items: [{ id: string, size?: string, qty: number }],
 *   customer: { fullName, email?, phone?, address? },
 *   paymentMethod: 'mercadopago' | 'whatsapp',
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    const { pageId, items, customer, paymentMethod, notes, clientId } = body;

    if (!pageId || typeof pageId !== 'string') return apiError('pageId es requerido', 400);
    if (!Array.isArray(items) || items.length === 0) return apiError('El carrito está vacío', 400);

    // ── Load the published page (source of truth for catalog + prices) ──
    // Solo matchear `id` si es un UUID válido (si no, Postgres lanza
    // "Inconsistent column data" y los slugs nunca resuelven).
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId);
    const page = await prisma.page.findFirst({
      where: { ...(isUuid ? { id: pageId } : { slug: pageId }), status: 'published' },
      include: { business: true },
    });
    if (!page) return apiError('Tienda no encontrada', 404);

    const pageSettings: Record<string, any> =
      page.settings && typeof page.settings === 'object' && !Array.isArray(page.settings) ? page.settings : {};
    const payCfg = resolvePaymentConfig(page.business, pageSettings);
    const products = pageProductMap(page);

    // ── Validate items against the page catalog, recompute prices server-side ──
    const lineItems: Array<{ product: any; qty: number; size: string }> = [];
    for (const raw of items) {
      const id = raw?.id != null ? String(raw.id) : '';
      const qty = Math.max(1, Math.min(99, Number(raw?.qty) || 1));
      const product = products.get(id);
      if (!product) {
        return apiError(`Producto no encontrado en esta tienda: ${id}`, 400);
      }
      lineItems.push({ product, qty, size: String(raw?.size || '') });
    }

    const subtotal = lineItems.reduce((sum, li) => sum + parsePrice(li.product.price) * li.qty, 0);
    if (subtotal <= 0) return apiError('El total del pedido debe ser mayor a cero', 400);

    // Shipping: free over S/150, otherwise S/10 (matches dashboard rule).
    const freeShippingThreshold = Number(pageSettings.freeShippingThreshold) || 150;
    const shippingAmount = subtotal >= freeShippingThreshold ? 0 : 10;
    const total = subtotal + shippingAmount;
    const currency = payCfg.currency;

    // ── Customer: resolve by email/phone or create ──
    const c = customer && typeof customer === 'object' ? customer : {};
    const fullName = String(c.fullName || '').trim();
    const email = String(c.email || '').trim().toLowerCase();
    const phone = String(c.phone || '').trim();
    if (!fullName) return apiError('El nombre completo es requerido', 400);
    if (!email && !phone) return apiError('Ingresa un email o teléfono de contacto', 400);

    let customerRecord = null;
    if (email) {
      customerRecord = await prisma.customer.findFirst({ where: { email } });
    } else if (phone) {
      customerRecord = await prisma.customer.findFirst({ where: { phone } });
    }
    if (!customerRecord) {
      customerRecord = await prisma.customer.create({
        data: {
          source: 'store',
          fullName,
          email: email || null,
          phone: phone || null,
          billingAddress: (c.address || {}) as any,
          shippingAddress: (c.address || {}) as any,
        },
      });
    } else {
      // Keep the record fresh with the latest contact data.
      customerRecord = await prisma.customer.update({
        where: { id: customerRecord.id },
        data: { fullName, ...(email ? { email } : {}), ...(phone ? { phone } : {}) },
      });
    }

    // ── Create the order ──
    const method = paymentMethod === 'mercadopago' ? 'mercadopago' : 'whatsapp';
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        source: 'store',
        customerId: customerRecord.id,
        businessId: page.businessId,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: method,
        currency,
        subtotal,
        discountAmount: 0,
        taxAmount: 0,
        shippingAmount,
        total,
        notes: String(notes || '') || null,
        billingAddress: (c.address || {}) as any,
        shippingAddress: (c.address || {}) as any,
        placedAt: new Date(),
        items: {
          create: lineItems.map((li) => ({
            productId: null,
            productName: String(li.product.name || 'Producto'),
            sku: String(li.product.sku || 'N/A'),
            quantity: li.qty,
            unitPrice: parsePrice(li.product.price),
            discountPercent: 0,
            discountAmount: 0,
            total: parsePrice(li.product.price) * li.qty,
          })),
        },
        statusHistory: {
          create: { toStatus: 'pending', changedByType: 'customer' },
        },
      },
      include: { items: true },
    });

    // ── El carrito abandonado se convirtió en pedido ──
    markCartConverted({ businessId: page.businessId, clientId: clientId ? String(clientId) : null, orderId: order.id });

    // ── GA4 Measurement Protocol: begin_checkout (fire-and-forget) ──
    trackGA4Event({
      business: page.business,
      eventName: 'begin_checkout',
      userId: email || undefined,
      params: { order_id: order.orderNumber, value: total, currency, items: lineItems.length },
    });

    // ── Notificaciones al dueño (no bloquean la respuesta) ──
    notifyOrderCreated(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        currency,
        paymentMethod: method,
        paymentStatus: 'pending',
        customerName: fullName,
        customerEmail: email || null,
        customerPhone: phone || null,
        shippingAddress: (c.address || {}) as any,
        notes: String(notes || '') || null,
        items: order.items.map((it: any) => ({
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
        })),
        placedAt: order.placedAt,
      },
      page.business,
      {}
    ).catch((e) => console.error('[ORDER NOTIFY]', (e as Error)?.message?.slice(0, 200)));

    // ── Payment URL ──
    let checkoutUrl: string | null = null;
    let whatsappUrl: string | null = null;

    if (method === 'mercadopago') {
      if (!payCfg.mpToken) {
        // No hay cuenta MP configurada: devolver el pedido con un código claro
        // y el enlace de WhatsApp como fallback para la UI.
        const waUrl = payCfg.whatsappNumber ? buildWhatsappOrderUrl(payCfg.whatsappNumber, order) : null;
        return apiSuccess(
          {
            order: publicOrderShape(order),
            paymentMethod: 'whatsapp',
            errorCode: 'MP_NOT_CONFIGURED',
            message: 'El pago con MercadoPago no está configurado en esta tienda — pedido enviado por WhatsApp',
            whatsappUrl: waUrl,
          },
          201
        );
      }
      const baseUrl = (process.env.WMS_URL || process.env.NEXTAUTH_URL || '').replace(/\/+$/, '');
      const back = `${baseUrl}/pedido/${order.orderNumber}`;
      try {
        const preference = await createPreference({
          items: order.items.map((it: any) => ({
            id: it.productId || undefined,
            title: it.productName,
            quantity: it.quantity,
            unit_price: Number(it.total) / it.quantity,
            currency_id: currency,
          })),
          externalReference: order.id,
          backUrls: { success: back, failure: back, pending: back },
          accessToken: payCfg.mpToken,
        });
        checkoutUrl = preference.init_point || preference.sandbox_init_point;
      } catch (prefError) {
        // Nunca perder el pedido: si la preferencia falla (token inválido, red,
        // límites), devolver el pedido con fallback a WhatsApp para no bloquear la venta.
        console.warn('[store/orders] MP preference failed:', (prefError as Error)?.message?.slice(0, 200));
        const waUrl = payCfg.whatsappNumber ? buildWhatsappOrderUrl(payCfg.whatsappNumber, order) : null;
        return apiSuccess(
          {
            order: publicOrderShape(order),
            paymentMethod: 'whatsapp',
            errorCode: 'MP_PAYMENT_FAILED',
            message: 'No se pudo iniciar el pago con tarjeta — te enviamos el pedido por WhatsApp',
            whatsappUrl: waUrl,
          },
          201
        );
      }
    } else {
      if (!payCfg.whatsappNumber) {
        return apiSuccess(
          {
            order: publicOrderShape(order),
            paymentMethod: 'whatsapp',
            errorCode: 'WHATSAPP_NOT_CONFIGURED',
            message: 'No hay número de WhatsApp configurado en esta tienda',
          },
          201
        );
      }
      whatsappUrl = buildWhatsappOrderUrl(payCfg.whatsappNumber, order);
    }

    return apiSuccess(
      {
        order: publicOrderShape(order),
        paymentMethod: method,
        checkoutUrl,
        whatsappUrl,
      },
      201
    );
  } catch (error) {
    console.error('[store/orders] create failed:', (error as Error)?.message?.slice(0, 500));
    return apiError(`Error al procesar el pedido: ${(error as Error)?.message?.slice(0, 200) || 'desconocido'}`, 500);
  }
}

function publicOrderShape(order: any) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingAmount: Number(order.shippingAmount),
    total: Number(order.total),
    symbol: currencySymbol(order.currency),
    items: (order.items || []).map((it: any) => ({
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
    placedAt: order.placedAt,
  };
}
