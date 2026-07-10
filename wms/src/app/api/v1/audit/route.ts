import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = getSearchParam(searchParams, 'table');
    const action = getSearchParam(searchParams, 'action');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (tableName) where.tableName = tableName;
    if (action) where.action = action;

    const result = await cached(`audit:${page}:${limit}:${tableName}:${action}`, () =>
      prisma.auditTrail.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (logs) => ({
        logs,
        total: await prisma.auditTrail.count({ where }),
      })),
      30
    );

    return apiPaginated(result.logs, result.total, page, limit);
  } catch (error) { return handleApiError(error, 'audit-list'); }
}
