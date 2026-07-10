import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
      include: {
        customer: true,
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        shipments: true,
      },
    });

    if (!order) return apiError('Order not found', 404);

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
    const body = await request.json();
    const { notes, internalNotes, paymentStatus } = body;

    const existing = await prisma.order.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Order not found', 404);

    const updated = await prisma.order.update({
      where: { id: params.id },
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
