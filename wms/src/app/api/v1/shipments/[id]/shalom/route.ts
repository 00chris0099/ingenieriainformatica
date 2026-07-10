import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';
import { createShipment as createShalomShipment, isConfigured } from '@/lib/logistics/shalom';

interface Props { params: { id: string } }

export async function POST(request: NextRequest, { params }: Props) {
  try {
    if (!isConfigured()) {
      return apiError('Shalom API no configurada. Registrar empresa en shalom.com.pe', 400);
    }

    const shipment = await prisma.shipment.findFirst({
      where: { OR: [{ id: params.id }, { shipmentNumber: params.id }] },
      include: { order: { include: { customer: true } } },
    });
    if (!shipment) return apiError('Shipment not found', 404);

    const customer = shipment.order?.customer;
    const address = (shipment.shippingAddress as any) || {};

    const result = await createShalomShipment({
      orderNumber: shipment.order?.orderNumber || shipment.shipmentNumber,
      originName: process.env.SHIPPING_ORIGIN_NAME || 'ADRISU KIDS',
      originPhone: process.env.SHIPPING_ORIGIN_PHONE || '999111222',
      originAddress: process.env.SHIPPING_ORIGIN_ADDRESS || 'Av. Industrial 123',
      originCity: process.env.SHIPPING_ORIGIN_CITY || 'Lima',
      originDepartment: process.env.SHIPPING_ORIGIN_DEPARTMENT || 'Lima',
      destName: customer?.fullName || address.name || 'Cliente',
      destPhone: customer?.phone || address.phone || '',
      destAddress: address.address || address.direccion || '',
      destCity: address.province || address.ciudad || 'Lima',
      destDepartment: address.department || address.departamento || 'Lima',
      destDistrict: address.district || address.distrito || '',
      weight: Number(shipment.weight) || 2,
      declaredValue: Number(shipment.cost) || Number(shipment.order?.total) || 50,
      description: `Pedido ${shipment.order?.orderNumber || shipment.shipmentNumber}`,
      reference: shipment.order?.orderNumber,
    });

    if (!result.success) {
      return apiError(result.error || 'Error al crear guia Shalom', 500);
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: { trackingNumber: result.trackingNumber || result.guideNumber, status: 'label_created' },
    });

    await prisma.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: 'label_created', description: `Guia Shalom creada: ${result.guideNumber}` },
    });

    await invalidateCache('shipments:*');

    return apiSuccess({
      guideNumber: result.guideNumber,
      trackingNumber: result.trackingNumber,
      carrier: result.carrier,
      estimatedDelivery: result.estimatedDelivery,
      shipment: updated,
    });
  } catch (error) { return handleApiError(error, 'shalom-create'); }
}
