import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';
import { VALID_TRANSITIONS } from '@/lib/orders';

interface Props {
  params: { id: string };
}

// Auto-create shipment record when order is ready to ship
async function autoCreateShipment(order: any) {
  try {
    const shipping = (order.shippingAddress as any) || {};
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    const totalWeight = items.reduce((sum: number, item: any) => sum + (item.quantity * 2), 0) || 2;

    const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
    if (warehouse) {
      await prisma.shipment.create({
        data: {
          shipmentNumber: `SHIP-${Date.now()}`,
          orderId: order.id,
          warehouseId: warehouse.id,
          carrier: 'Por asignar',
          trackingNumber: null,
          status: 'pending',
          shippingAddress: order.shippingAddress || {},
          weight: totalWeight,
          cost: Number(order.total) * 0.05,
          estimatedDelivery: null,
          notes: `Auto-created from order ${order.orderNumber}`,
        },
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error('[Shipment] Auto-create error:', error.message);
    return null;
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { status, reason } = body;

    if (!status) return apiError('Status is required', 400);

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
    });

    if (!order) return apiError('Order not found', 404);

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return apiError(`Cannot transition from '${order.status}' to '${status}'`, 400);
    }

    const oldStatus = order.status;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: status as any,
        confirmedAt: status === 'confirmed' ? new Date() : order.confirmedAt,
        shippedAt: status === 'shipped' ? new Date() : order.shippedAt,
        deliveredAt: status === 'delivered' ? new Date() : order.deliveredAt,
        cancelledAt: status === 'cancelled' ? new Date() : order.cancelledAt,
        statusHistory: {
          create: {
            fromStatus: oldStatus as any,
            toStatus: status as any,
            changedByType: 'user',
            reason: reason || null,
          },
        },
      },
      include: { statusHistory: { orderBy: { createdAt: 'desc' } }, customer: true },
    });

    await invalidateCache('orders:*');

    // Auto-create shipment when status is "ready_to_ship"
    let shipmentResult = null;
    if (status === 'ready_to_ship') {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, customer: true },
      });
      if (orderWithItems) {
        shipmentResult = await autoCreateShipment({
          ...orderWithItems,
          customerName: orderWithItems.customer?.fullName,
          customerPhone: orderWithItems.customer?.phone,
        });
      }
    }

    // Send status update email (fire and forget)
    try {
      if (updated.customer?.email) {
        const { sendEmail, orderStatusUpdateEmail } = await import('@/lib/notifications/email');
        const statusLabels: Record<string, string> = {
          pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
          picking: 'En picking', packing: 'Empaquetando', ready_to_ship: 'Listo para enviar',
          shipped: 'Enviado', in_transit: 'En transito', delivered: 'Entregado',
          cancelled: 'Cancelado', returned: 'Devuelto', refunded: 'Reembolsado',
        };
        sendEmail({
          to: updated.customer.email,
          subject: `Pedido ${order.orderNumber} - ${statusLabels[status] || status}`,
          html: orderStatusUpdateEmail({
            orderNumber: order.orderNumber,
            customerName: updated.customer.fullName,
            status,
            statusLabel: statusLabels[status] || status,
          }),
        });
      }
    } catch (e) { console.error('Failed to send status email:', e); }

    // Create in-app notification (fire and forget)
    try {
      const statusLabels2: Record<string, string> = {
        pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
        picking: 'Preparando', packing: 'Empaquetando', ready_to_ship: 'Listo para enviar',
        shipped: 'Enviado', in_transit: 'En transito', delivered: 'Entregado', cancelled: 'Cancelado',
      };
      await prisma.notificationQueue.create({
        data: {
          subject: `Pedido ${order.orderNumber} - ${statusLabels2[status] || status}`,
          body: `Estado cambiado de "${statusLabels2[oldStatus] || oldStatus}" a "${statusLabels2[status] || status}"`,
          type: 'status',
        },
      });
    } catch (e) { console.error('Failed to create notification:', e); }

    return apiSuccess({
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      history: updated.statusHistory,
    });
  } catch (error) {
    return handleApiError(error, 'order-status');
  }
}
