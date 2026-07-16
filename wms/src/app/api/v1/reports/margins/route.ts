import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isActive: true },
      include: {
        product: { select: { name: true, sku: true } },
        orderItems: {
          where: { order: { status: { in: ['paid', 'delivered', 'completed'] } } },
          select: { unitPrice: true, quantity: true, total: true },
        },
      },
    });

    const data = variants
      .map((v) => {
        const revenue = v.orderItems.reduce((sum, i) => sum + Number(i.total || i.unitPrice * i.quantity), 0);
        const unitsSold = v.orderItems.reduce((sum, i) => sum + i.quantity, 0);
        const cost = Number(v.cost || v.price || 0) * unitsSold * 0.6;
        const margin = revenue - cost;
        return {
          name: v.product.name,
          sku: v.product.sku,
          variant: v.name,
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
