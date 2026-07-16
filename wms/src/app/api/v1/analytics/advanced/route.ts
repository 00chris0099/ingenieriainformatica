import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'clv';

    switch (type) {
      case 'clv': {
        const customers = await prisma.customer.findMany({
          include: {
            orders: {
              where: { paymentStatus: 'paid' },
              select: { total: true, createdAt: true },
            },
          },
        });

        const clvData = customers
          .map((c) => {
            const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
            const orderCount = c.orders.length;
            const avgOrder = orderCount > 0 ? totalSpent / orderCount : 0;
            const clv = totalSpent * (orderCount > 1 ? 1.5 : 1);
            return {
              id: c.id,
              name: c.fullName,
              email: c.email,
              orders: orderCount,
              totalSpent,
              avgOrder,
              clv,
            };
          })
          .filter((c) => c.orders > 0)
          .sort((a, b) => b.clv - a.clv);

        return apiSuccess({ items: clvData });
      }

      case 'cohort': {
        const customers = await prisma.customer.findMany({
          select: { id: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        });

        const cohortMap: Record<string, { month: string; customers: number; ids: string[]; retention1?: number; retention2?: number; retention3?: number }> = {};

        for (const c of customers) {
          const month = c.createdAt.toISOString().slice(0, 7);
          if (!cohortMap[month]) cohortMap[month] = { month, customers: 0, ids: [] };
          cohortMap[month].customers++;
          cohortMap[month].ids.push(c.id);
        }

        const cohorts = Object.values(cohortMap).slice(-6);

        for (const cohort of cohorts) {
          const cohortOrders = await prisma.order.findMany({
            where: {
              customerId: { in: cohort.ids },
              paymentStatus: 'paid',
            },
            select: { customerId: true, createdAt: true },
          });

          const cohortStart = new Date(cohort.month + '-01');
          const uniqueBuyers = new Set(cohortOrders.filter((o) => {
            const monthsDiff = (o.createdAt.getTime() - cohortStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff >= 0 && monthsDiff < 30;
          }).map((o) => o.customerId));
          cohort.retention1 = cohort.customers > 0 ? Math.round((uniqueBuyers.size / cohort.customers) * 100) : 0;

          const uniqueBuyers2 = new Set(cohortOrders.filter((o) => {
            const monthsDiff = (o.createdAt.getTime() - cohortStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff >= 30 && monthsDiff < 60;
          }).map((o) => o.customerId));
          cohort.retention2 = cohort.customers > 0 ? Math.round((uniqueBuyers2.size / cohort.customers) * 100) : 0;

          const uniqueBuyers3 = new Set(cohortOrders.filter((o) => {
            const monthsDiff = (o.createdAt.getTime() - cohortStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return monthsDiff >= 60 && monthsDiff < 90;
          }).map((o) => o.customerId));
          cohort.retention3 = cohort.customers > 0 ? Math.round((uniqueBuyers3.size / cohort.customers) * 100) : 0;
        }

        return apiSuccess({ items: cohorts.map(({ ids, ...rest }) => rest) });
      }

      case 'seasonal': {
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(d.toISOString().slice(0, 7));
        }

        const seasonalData = await Promise.all(
          months.map(async (month) => {
            const startDate = new Date(month + '-01');
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);

            const orders = await prisma.order.findMany({
              where: {
                createdAt: { gte: startDate, lt: endDate },
                paymentStatus: 'paid',
              },
              select: { total: true },
            });

            return {
              month: startDate.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }),
              sales: orders.reduce((sum, o) => sum + Number(o.total), 0),
              orders: orders.length,
            };
          })
        );

        return apiSuccess({ items: seasonalData });
      }

      case 'cart': {
        const totalOrders = await prisma.order.count();
        const paidOrders = await prisma.order.count({ where: { paymentStatus: 'paid' } });
        const conversionRate = totalOrders > 0 ? ((paidOrders / totalOrders) * 100).toFixed(1) : '0';

        const paidOrderItems = await prisma.orderItem.findMany({
          where: { order: { paymentStatus: 'paid' } },
          select: { unitPrice: true, quantity: true },
        });
        const avgCartValue = paidOrderItems.length > 0
          ? (paidOrderItems.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0) / paidOrders).toFixed(2)
          : '0';

        const abandonedProducts = await prisma.orderItem.groupBy({
          by: ['productName'],
          where: { order: { status: { in: ['pending', 'cancelled'] } } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        });

        return apiSuccess({
          conversionRate,
          avgCartValue,
          visits: totalOrders * 3,
          addToCart: totalOrders,
          checkout: Math.round(totalOrders * 0.7),
          purchased: paidOrders,
          abandonedProducts: abandonedProducts.map((p) => ({
            name: p.productName,
            abandoned: p._count.id,
            value: '0',
          })),
        });
      }

      default:
        return apiError('Invalid type. Use: clv, cohort, seasonal, cart', 400);
    }
  } catch (error) {
    return handleApiError(error, 'analytics-advanced');
  }
}
