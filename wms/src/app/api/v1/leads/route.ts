import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, getSearchParam, parsePagination } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const q = getSearchParam(searchParams, 'q');
    const businessId = getSearchParam(searchParams, 'businessId');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (!scope.isStaff) where.businessId = { in: scope.ids };
    else if (businessId) where.businessId = businessId;
    if (status && status !== 'all') where.status = status;
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          page: { select: { title: true, slug: true } },
          business: { select: { id: true, name: true, slug: true } },
          convertedCustomer: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    // Stats por estado (para el pipeline)
    const statusGroups = await prisma.lead.groupBy({
      by: ['status'],
      where: (scope.isStaff && businessId ? { businessId } : scope.isStaff ? {} : { businessId: { in: scope.ids } }) as any,
      _count: { _all: true },
    });
    const stats = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));

    return apiSuccess({ leads, total, page, limit, stats });
  } catch (error) {
    console.error('[leads] list:', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al listar leads', 500);
  }
}
