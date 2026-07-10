import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, parsePagination, getSearchParam, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`warehouses:${page}:${limit}`, () =>
      withDbFallback(
        async () => {
          const [warehouses, total] = await Promise.all([
            prisma.warehouse.findMany({
              include: {
                _count: { select: { inventory: true, locations: true } },
              },
              orderBy: { createdAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.warehouse.count(),
          ]);
          return { warehouses, total };
        },
        () => ({ warehouses: [], total: 0 })
      ), 300
    );

    return apiPaginated(result.warehouses, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'warehouses-list');
  }
}
