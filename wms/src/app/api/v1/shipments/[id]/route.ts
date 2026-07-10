import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const shipment = await prisma.shipment.findFirst({
      where: { OR: [{ id: params.id }, { shipmentNumber: params.id }] },
      include: { order: { include: { customer: true } }, warehouse: true, events: { orderBy: { createdAt: 'desc' } } },
    });
    if (!shipment) return apiError('Shipment not found', 404);
    return apiSuccess(shipment);
  } catch (error) { return handleApiError(error, 'shipment-detail'); }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { status, trackingNumber, notes } = body;
    const shipment = await prisma.shipment.findFirst({ where: { OR: [{ id: params.id }, { shipmentNumber: params.id }] } });
    if (!shipment) return apiError('Shipment not found', 404);

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        ...(status && { status }),
        ...(trackingNumber && { trackingNumber }),
        ...(notes && { notes }),
        actualDelivery: status === 'delivered' ? new Date() : shipment.actualDelivery,
      },
    });

    if (status) {
      await prisma.shipmentEvent.create({
        data: { shipmentId: shipment.id, status, description: notes || `Estado cambiado a ${status}` },
      });
    }

    await invalidateCache('shipments:*');
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'shipment-update'); }
}
