import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';

/**
 * GET - Fetch analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const startDate = getStartDate(period);

    // Fetch all analytics data in parallel
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      ordersByStatus,
      revenueByMonth,
      topProducts,
      ordersByDay,
      inventoryStats,
      pickingStats,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          paymentStatus: 'paid',
        },
        _sum: { total: true },
      }),

      // Total customers
      prisma.customer.count(),

      // Total products
      prisma.product.count({
        where: { status: 'active' },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),

      // Revenue by month (last 12 months)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '12 months'
          AND payment_status = 'paid'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,

      // Top products by order count
      prisma.$queryRaw`
        SELECT 
          p.name,
          p.sku,
          COUNT(oi.id) as order_count,
          SUM(oi.quantity) as total_quantity
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${startDate}
        GROUP BY p.id, p.name, p.sku
        ORDER BY order_count DESC
        LIMIT 10
      `,

      // Orders by day of week
      prisma.$queryRaw`
        SELECT 
          EXTRACT(DOW FROM created_at) as day,
          COUNT(*) as count
        FROM orders
        WHERE created_at >= ${startDate}
        GROUP BY EXTRACT(DOW FROM created_at)
        ORDER BY day ASC
      `,

      // Inventory stats
      prisma.inventory.aggregate({
        _sum: {
          quantity: true,
          reservedQuantity: true,
          availableQuantity: true,
        },
        _count: true,
      }),

      // Picking stats (from pick lists)
      prisma.pickList.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Calculate metrics
    const avgOrderValue = totalOrders > 0
      ? Number(totalRevenue._sum.total || 0) / totalOrders
      : 0;

    const lowStockCount = await prisma.inventory.count({
      where: {
        availableQuantity: { lte: prisma.inventory.fields.reorderPoint },
      },
    });

    return NextResponse.json({
      data: {
        overview: {
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.total || 0),
          totalCustomers,
          totalProducts,
          avgOrderValue,
          lowStockCount,
        },
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        revenueByMonth,
        topProducts,
        ordersByDay: ordersByDay.map((d) => ({
          day: getDayName(Number(d.day)),
          count: Number(d.count),
        })),
        inventory: {
          totalQuantity: Number(inventoryStats._sum.quantity || 0),
          totalReserved: Number(inventoryStats._sum.reservedQuantity || 0),
          totalAvailable: Number(inventoryStats._sum.availableQuantity || 0),
          totalLocations: inventoryStats._count,
        },
        picking: {
          draft: pickingStats.find((s) => s.status === 'draft')?._count || 0,
          inProgress: pickingStats.find((s) => s.status === 'in_progress')?._count || 0,
          completed: pickingStats.find((s) => s.status === 'completed')?._count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

function getDayName(day: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return days[day] || 'Desconocido';
}
