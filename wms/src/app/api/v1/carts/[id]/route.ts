import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { canAccessBusiness } from '@/lib/api/business-access';
import { sendRecoveryForSession } from '@/lib/carts';

/**
 * PATCH /api/v1/carts/[id]
 *   { action: 'notify' }                    → enviar recordatorio ahora (sin esperar 30 min)
 *   { action: 'status', status: 'recovered'|'converted'|'expired' } → cambio manual
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return apiError('No autorizado', 401);

    const body = await request.json().catch(() => null);
    const action = body?.action || 'status';

    const cart = await prisma.abandonedCheckout.findUnique({ where: { id } });
    if (!cart) return apiError('Carrito no encontrado', 404);

    if (!(await canAccessBusiness(session.user, cart.businessId))) {
      return apiError('No tienes acceso a esta tienda', 403);
    }

    if (action === 'notify') {
      const sent = await sendRecoveryForSession(id);
      return apiSuccess({ sent, status: 'notified' });
    }

    const status = String(body?.status || '').trim();
    const valid = ['active', 'notified', 'recovered', 'converted', 'expired'];
    if (!valid.includes(status)) return apiError('Estado inválido', 400);

    const updated = await prisma.abandonedCheckout.update({
      where: { id },
      data: {
        status,
        ...(status === 'recovered' ? { recoveredAt: new Date() } : {}),
        ...(status === 'converted' ? { convertedAt: new Date() } : {}),
        ...(status === 'active' ? { notifiedAt: null } : {}),
      },
    });

    return apiSuccess({ status: updated.status });
  } catch (error) {
    console.error('[carts PATCH]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al actualizar el carrito', 500);
  }
}
