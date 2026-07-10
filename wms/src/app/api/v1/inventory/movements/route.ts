import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiPaginated, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variant_id');
    const warehouseId = searchParams.get('warehouse_id');
    const { page, limit, offset } = parsePagination(searchParams);

    // Inventory movements are tracked via audit trail
    const where: any = { tableName: 'inventory' };
    if (variantId) where.recordId = variantId;

    const result = await cached(`inventory-movements:${page}:${limit}`, () =>
      prisma.auditTrail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (logs) => ({
        movements: logs,
        total: await prisma.auditTrail.count({ where }),
      })),
      30
    );

    return apiPaginated(result.movements, result.total, page, limit);
  } catch (error) { return handleApiError(error, 'inventory-movements'); }
}
