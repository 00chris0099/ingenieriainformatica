import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { VALID_TRANSITIONS } from '@/lib/orders';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    const cacheKey = `orders:${page}:${limit}:${status}:${search}`;

    const result = await cached(cacheKey, () =>
      withDbFallback(
        async () => {
          const where: any = {};
          if (status) where.status = status;
          if (search) {
            where.OR = [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { customer: { fullName: { contains: search, mode: 'insensitive' } } },
            ];
          }

          const [orders, total] = await Promise.all([
            prisma.order.findMany({
              where,
              include: {
                customer: true,
                items: true,
                _count: { select: { statusHistory: true } },
              },
              orderBy: { createdAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.order.count({ where }),
          ]);
          return { orders, total };
        },
        () => ({ orders: [], total: 0 })
      ), 30
    );

    const mapped = result.orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      source: o.source,
      customer: o.customer?.fullName || 'Unknown',
      customerId: o.customerId,
      status: o.status,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      taxAmount: Number(o.taxAmount),
      shippingAmount: Number(o.shippingAmount),
      total: Number(o.total),
      itemsCount: o.items.length,
      placedAt: o.placedAt,
      confirmedAt: o.confirmedAt,
      shippedAt: o.shippedAt,
      deliveredAt: o.deliveredAt,
      createdAt: o.createdAt,
    }));

    return apiPaginated(mapped, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'orders-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, items, notes, internalNotes, source } = body;

    if (!items?.length) return apiError('At least one item is required', 400);

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const discountAmount = items.reduce((sum: number, item: any) => sum + (item.discountAmount || 0), 0);
    const shippingAmount = subtotal >= 150 ? 0 : 10;
    const total = subtotal - discountAmount + shippingAmount;

    // Generate order number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.order.count();
    const orderNumber = `ADR-${dateStr}-${String(count + 1).padStart(5, '0')}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        source: source || 'wms',
        customerId: customerId || (await createGuestCustomer()).id,
        status: 'pending',
        paymentStatus: 'pending',
        currency: 'PEN',
        subtotal,
        discountAmount,
        taxAmount: 0,
        shippingAmount,
        total,
        notes: notes || null,
        internalNotes: internalNotes || null,
        placedAt: now,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId || '00000000-0000-0000-0000-000000000000',
            productName: item.productName || item.name,
            variantName: item.variantName || item.name,
            sku: item.sku || 'N/A',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
            total: item.unitPrice * item.quantity - (item.discountAmount || 0),
          })),
        },
        statusHistory: {
          create: {
            toStatus: 'pending',
            changedByType: 'user',
          },
        },
      },
      include: { customer: true, items: true },
    });

    await invalidateCache('orders:*');

    return apiSuccess({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status,
    }, 201);
  } catch (error) {
    return handleApiError(error, 'orders-create');
  }
}

async function createGuestCustomer() {
  return prisma.customer.create({
    data: {
      source: 'wms',
      fullName: 'Cliente WMS',
      email: `guest-${Date.now()}@temp.com`,
      password: 'guest',
    },
  });
}
