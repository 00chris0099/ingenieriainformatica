import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;

    const result = await cached(`shipments:${page}:${limit}:${status}`, () =>
      prisma.shipment.findMany({
        where,
        include: { order: true, warehouse: true, events: { orderBy: { createdAt: 'desc' }, take: 5 } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (shipments) => ({
        shipments,
        total: await prisma.shipment.count({ where }),
      })),
      30
    );

    return apiPaginated(result.shipments, result.total, page, limit);
  } catch (error) { return handleApiError(error, 'shipments-list'); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, warehouseId, carrier, trackingNumber, shippingAddress, estimatedDelivery, weight, cost } = body;

    if (!warehouseId || !carrier) return apiError('warehouseId and carrier required', 400);

    const count = await prisma.shipment.count();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const shipmentNumber = `ENV-${dateStr}-${String(count + 1).padStart(5, '0')}`;

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        orderId: orderId || null,
        warehouseId,
        carrier,
        trackingNumber: trackingNumber || null,
        status: 'pending',
        shippingAddress: shippingAddress || {},
        weight: weight || null,
        cost: cost || null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      },
    });

    await invalidateCache('shipments:*');
    return apiSuccess(shipment, 201);
  } catch (error) { return handleApiError(error, 'shipments-create'); }
}
