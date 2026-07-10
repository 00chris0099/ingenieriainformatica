import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;

    const result = await cached(`purchase-orders:${page}:${limit}:${status}`, () =>
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, warehouse: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (pos) => ({
        pos,
        total: await prisma.purchaseOrder.count({ where }),
      })),
      30
    );

    return apiPaginated(result.pos, result.total, page, limit);
  } catch (error) { return handleApiError(error, 'purchase-orders-list'); }
}
