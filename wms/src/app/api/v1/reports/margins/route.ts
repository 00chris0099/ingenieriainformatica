import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { status: { not: 'archived' } },
      include: {
        category: { select: { name: true } },
        orderItems: {
          where: { order: { paymentStatus: 'paid' } },
          select: { unitPrice: true, quantity: true, total: true },
        },
      },
    });

    const data = products
      .map((p) => {
        const revenue = p.orderItems.reduce((sum, i) => sum + Number(i.total || Number(i.unitPrice) * i.quantity), 0);
        const unitsSold = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
        const cost = Number(p.costPrice || p.price || 0) * unitsSold;
        const margin = revenue - cost;
        return {
          name: p.name,
          sku: p.sku,
          category: p.category?.name || 'Sin categoria',
          revenue,
          cost,
          margin,
          unitsSold,
        };
      })
      .filter((v) => v.revenue > 0)
      .sort((a, b) => b.margin - a.margin);

    return apiSuccess({ items: data });
  } catch (error) {
    return handleApiError(error, 'report-margins');
  }
}
