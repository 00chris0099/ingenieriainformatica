import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Público (sin auth): slots ya ocupados de una tienda para una fecha.
 * `?business=<slug|id>&date=YYYY-MM-DD`
 * Solo cuenta citas en estado confirmed o completed (las cancelled liberan el slot).
 */
export async function GET(request: NextRequest) {
  let date = '';
  try {
    const { searchParams } = new URL(request.url);
    const businessParam = searchParams.get('business') || '';
    date = searchParams.get('date') || '';

    if (!businessParam) return apiSuccess({ date, taken: [] });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiSuccess({ date, taken: [], error: 'Formato de fecha inválido (YYYY-MM-DD)' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessParam);
    const where: any = [{ slug: businessParam }];
    if (isUuid) where.push({ id: businessParam });

    const business = await prisma.business.findFirst({
      where: { OR: where, isActive: true },
      select: { id: true },
    });
    if (!business) return apiSuccess({ date, taken: [] });

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const rows = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: { gte: dayStart, lte: dayEnd },
        status: { in: ['confirmed', 'completed'] },
      },
      select: { slotTime: true },
    });

    return apiSuccess({ date, taken: rows.map((r) => r.slotTime) });
  } catch (error) {
    console.error('[BOOKINGS AVAILABILITY]', (error as Error)?.message?.slice(0, 200));
    return apiSuccess({ date, taken: [] });
  }
}
