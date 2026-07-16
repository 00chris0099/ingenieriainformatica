import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, checkRateLimit, validate } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: max 5 orders per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateCheck = checkRateLimit(`order-create:${ip}`, 5, 60);
    if (!rateCheck.allowed) return apiError('Too many requests', 429);

    const body = await request.json();
    const { items, customer, shipping, paymentMethod, suggestedProducts } = body;

    // Validate items array
    if (!items?.length) return apiError('No items in order', 400);
    if (!Array.isArray(items)) return apiError('Items must be an array', 400);

    for (const item of items) {
      const itemError = validate(item, {
        name: { required: true, type: 'string' },
        price: { required: true, type: 'number' },
        quantity: { required: true, type: 'number' },
      });
      if (itemError) return apiError(`Invalid item: ${itemError}`, 400);
      if (item.quantity < 1 || item.quantity > 100) return apiError('Quantity must be between 1 and 100', 400);
      if (item.price < 0) return apiError('Price cannot be negative', 400);
    }

    // Validate customer email if provided
    if (customer?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) return apiError('Invalid email format', 400);
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const suggestedTotal = suggestedProducts?.reduce((sum: number, item: any) => sum + item.price, 0) || 0;
    if (subtotal + suggestedTotal > 50000) return apiError('Order total exceeds limit', 400);

    const shippingAmount = subtotal >= 150 ? 0 : 10;
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100; // IGV 18%
    const total = subtotal + shippingAmount + taxAmount + suggestedTotal;

    // Generate order number with random suffix to avoid race conditions
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ADR-${dateStr}-${randomSuffix}`;

    // Find or create customer
    let customerId: string;
    if (customer?.email) {
      const existing = await prisma.customer.findFirst({ where: { email: customer.email } });
      if (existing) {
        customerId = existing.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            email: customer.email,
            fullName: customer.name,
            phone: customer.phone || null,
            password: 'guest',
          },
        });
        customerId = newCustomer.id;
      }
    } else {
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const guest = await prisma.customer.create({
        data: { email: `${guestId}@temp.com`, fullName: 'Cliente temporal', password: 'guest' },
      });
      customerId = guest.id;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        status: 'confirmed',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod || 'yape',
        currency: 'PEN',
        subtotal,
        taxAmount,
        shippingAmount,
        total,
        shippingAddress: shipping || {},
        internalNotes: suggestedProducts?.length ? JSON.stringify({ suggestedProducts }) : null,
        placedAt: now,
        items: {
          create: items.map((item: any) => {
            if (!item.variantId && !item.isSuggested) {
              throw new Error(`Item "${item.name}" is missing variantId`);
            }
            return {
              variantId: item.isSuggested ? null : item.variantId,
              productName: item.name,
              variantName: item.name,
              sku: item.sku || (item.isSuggested ? `suggested-${Date.now()}` : 'N/A'),
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.price * item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    // Fire and forget: email + WMS notification
    const orderResponse = {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status,
    };

    // Send confirmation email (non-blocking)
    const customerEmail = customer?.email;
    if (customerEmail) {
      import('@/lib/notifications/email').then(({ sendEmail, orderConfirmationEmail }) => {
        sendEmail({
          to: customerEmail,
          subject: `Pedido ${order.orderNumber} confirmado - ADRISU KIDS`,
          html: orderConfirmationEmail({
            orderNumber: order.orderNumber,
            customerName: customer.name,
            items: items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
            total: total,
            shippingAddress: shipping,
          }),
        });
      }).catch(() => {});
    }

    // Create WMS notification (non-blocking)
    prisma.notificationQueue.create({
      data: {
        subject: `Nuevo pedido ${order.orderNumber}`,
        body: `${customer.name} - S/ ${total.toFixed(2)} - ${items.length} productos - ${paymentMethod === 'contraentrega' ? 'Contraentrega' : 'MercadoPago'}`,
        type: 'order',
      },
    }).catch(() => {});

    return apiSuccess(orderResponse, 201);
  } catch (error) {
    return handleApiError(error, 'store-order-create');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');
    if (!orderNumber) return apiError('Order number required', 400);

    // Validate order number format (accept both WMS and Tienda formats)
    if (!/^ADR-\d{8}-[A-Z0-9]{5,}$/.test(orderNumber)) return apiError('Invalid order number format', 400);

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        customer: true,
        shipments: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return apiError('Order not found', 404);
    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error, 'store-order-get');
  }
}
