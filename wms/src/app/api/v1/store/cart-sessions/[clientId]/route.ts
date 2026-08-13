import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { cartShape } from '@/lib/carts';

/**
 * GET /api/v1/store/cart-sessions/[clientId]?business=<slug|id> — public.
 * Restaura el carrito de un visitante desde el enlace de recompra
 * (?restore=<clientId> en /p/[slug]). Si la sesión estaba 'notified', el hecho
 * de volver la reactiva ('active') para reiniciar el reloj de abandono.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const businessParam = request.nextUrl.searchParams.get('business') || '';

    if (!businessParam) return apiError('business es requerido', 400);

    const business = await prisma.business.findFirst({
      where: businessParam.includes('-') && /^[0-9a-f-]{36}$/i.test(businessParam)
        ? { id: businessParam }
        : { slug: businessParam },
    });
    if (!business) return apiError('Tienda no encontrada', 404);

    const session = await prisma.abandonedCheckout.findUnique({
      where: { businessId_clientId: { businessId: business.id, clientId } },
    });
    if (!session) return apiError('Carrito no encontrado', 404);

    // El cliente volvió: reactivar la sesión (sin re-notificar).
    if (session.status === 'notified') {
      await prisma.abandonedCheckout.update({
        where: { id: session.id },
        data: { status: 'active', notifiedAt: null },
      });
      session.status = 'active';
      session.notifiedAt = null;
    }

    return apiSuccess({ cart: cartShape(session) });
  } catch (error) {
    console.error('[store/cart-sessions GET]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al restaurar el carrito', 500);
  }
}
