import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, parsePagination, getSearchParam } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';
import { isUuid } from '@/lib/blog';

const VALID_STATUS = ['confirmed', 'cancelled', 'completed'];

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const businessId = getSearchParam(searchParams, 'businessId');
    const status = getSearchParam(searchParams, 'status');
    const from = getSearchParam(searchParams, 'from');
    const to = getSearchParam(searchParams, 'to');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (!scope.isStaff) {
      where.businessId = { in: scope.ids };
    } else if (businessId && isUuid(businessId)) {
      where.businessId = businessId;
    }
    if (status && VALID_STATUS.includes(status)) where.status = status;
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.date = { ...(where.date || {}), gte: new Date(`${from}T00:00:00.000Z`) };
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.date = { ...(where.date || {}), lte: new Date(`${to}T23:59:59.999Z`) };

    const [rows, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, slug: true } },
          page: { select: { id: true, title: true, slug: true } },
        },
        orderBy: [{ date: 'desc' }, { slotTime: 'asc' }],
        skip: offset,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    return apiPaginated(rows, total, page, limit);
  } catch (error) {
    console.error('[BOOKINGS GET]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al listar las citas', 500);
  }
}
