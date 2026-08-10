import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        customer: true,
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        shipments: true,
      },
    });

    if (!order) return apiError('Order not found', 404);
    if (!belongsToScope(order.businessId, scope)) {
      return apiError('Forbidden: este pedido no pertenece a tus tiendas', 403);
    }

    return apiSuccess({
      ...order,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        discountPercent: Number(item.discountPercent),
        discountAmount: Number(item.discountAmount),
        total: Number(item.total),
      })),
    });
  } catch (error) {
    return handleApiError(error, 'order-detail');
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const { notes, internalNotes, paymentStatus } = body;
    const { id } = await params;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return apiError('Order not found', 404);
    if (!belongsToScope(existing.businessId, scope)) {
      return apiError('Forbidden: este pedido no pertenece a tus tiendas', 403);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
        ...(internalNotes !== undefined && { internalNotes }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: { customer: true, items: true },
    });

    await invalidateCache('orders:*');

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'orders-update');
  }
}
