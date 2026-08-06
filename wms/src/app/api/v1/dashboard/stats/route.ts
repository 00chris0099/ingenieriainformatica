import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';
import { cached } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    const stats = await cached(`dashboard:stats:${period}`, async () => {
      const now = new Date();
      let dateFilter: any = {};

      if (period === 'today') {
        dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
      } else if (period === 'month') {
        dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
      }

      const [totalProducts, activeProducts, totalOrders, pendingOrders, totalCustomers, totalRevenue] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: 'active' } }),
        prisma.order.count({ where: Object.keys(dateFilter).length ? { createdAt: dateFilter } : {} }),
        prisma.order.count({ where: { status: 'pending' } }),
        prisma.customer.count(),
        prisma.order.aggregate({
          where: { status: { not: 'cancelled' }, ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}) },
          _sum: { total: true },
        }),
      ]);

      const lowStockResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
        `SELECT COUNT(*)::int as count FROM "products" WHERE "low_stock_alert" IS NOT NULL AND stock <= "low_stock_alert"`
      );
      const lowStockProducts = lowStockResult[0]?.count || 0;

      return {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalRevenue: Number(totalRevenue._sum.total || 0),
      };
    }, 60);

    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error, 'dashboard-stats');
  }
}
