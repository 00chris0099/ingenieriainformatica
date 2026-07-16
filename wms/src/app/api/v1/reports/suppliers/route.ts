import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: {
          select: { total: true, createdAt: true, expectedDate: true, receivedDate: true },
        },
      },
    });

    const data = suppliers.map((s) => {
      const orders = s.purchaseOrders;
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const deliveryTimes = orders
        .filter((o) => o.receivedDate && o.expectedDate)
        .map((o) => Math.abs((o.receivedDate!.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const avgDelivery = deliveryTimes.length > 0
        ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
        : 0;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        orders: orders.length,
        totalSpent,
        avgDelivery,
        rating: s.rating,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return apiSuccess({ items: data });
  } catch (error) {
    return handleApiError(error, 'report-suppliers');
  }
}
