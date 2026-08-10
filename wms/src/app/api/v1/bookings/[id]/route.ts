import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

interface Props { params: Promise<{ id: string }> }

const VALID_STATUS = ['confirmed', 'cancelled', 'completed'];

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const booking = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    });
    if (!booking) return apiError('Cita no encontrada', 404);
    if (!belongsToScope(booking.businessId, scope)) {
      return apiError('Forbidden: la cita no pertenece a tus tiendas', 403);
    }

    const body = await request.json();
    const { status } = body;
    if (!status || !VALID_STATUS.includes(status)) {
      return apiError(`Estado inválido. Valores permitidos: ${VALID_STATUS.join(', ')}`, 400);
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        page: { select: { id: true, title: true } },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[BOOKING PATCH]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al actualizar la cita', 500);
  }
}
