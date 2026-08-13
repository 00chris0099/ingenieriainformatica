import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { getBusinessScope } from '@/lib/api/business-access';
import { recoverAbandonedCarts } from '@/lib/carts';

/**
 * POST /api/v1/carts/recover — dispara el barrido de recuperación ahora.
 * Autenticado (staff/cliente, scoped) o con header `x-cron-secret` para cron
 * (cron-job.org / EasyPanel). Body: { businessId? }
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret');
    const isCron = !!cronSecret && !!process.env.CART_CRON_SECRET && cronSecret === process.env.CART_CRON_SECRET;

    let scopeIds: string[] = [];

    if (!isCron) {
      const session = await auth();
      if (!session?.user?.id) return apiError('No autorizado', 401);
      const scope = await getBusinessScope(session.user);
      scopeIds = scope.ids;
    }

    const body = await request.json().catch(() => null);
    const businessId = body?.businessId ? String(body.businessId) : undefined;

    if (businessId && scopeIds.length > 0 && !scopeIds.includes(businessId)) {
      return apiError('No tienes acceso a esta tienda', 403);
    }

    const recovered = await recoverAbandonedCarts({
      ...(businessId ? { businessId } : {}),
      limit: 100,
    });

    return apiSuccess({ recovered });
  } catch (error) {
    console.error('[carts recover]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al ejecutar la recuperación', 500);
  }
}
