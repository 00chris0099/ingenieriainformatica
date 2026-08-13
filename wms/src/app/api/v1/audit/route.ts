import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = getSearchParam(searchParams, 'table');
    const action = getSearchParam(searchParams, 'action');
    const from = getSearchParam(searchParams, 'from');
    const to = getSearchParam(searchParams, 'to');
    const { page, offset } = parsePagination(searchParams);
    // Hasta 5000 filas para la exportación CSV (el límite por defecto es 100).
    const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = {};
    if (tableName) where.tableName = tableName;
    if (action) where.action = action;
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) where.createdAt = { ...(where.createdAt || {}), gte: d };
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        where.createdAt = { ...(where.createdAt || {}), lte: d };
      }
    }

    const result = await cached(`audit:${page}:${limit}:${tableName}:${action}:${from}:${to}`, () =>
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
