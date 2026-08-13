import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { normalizeCartItems, upsertCartSession } from '@/lib/carts';

/**
 * POST /api/v1/store/cart-sessions — public.
 * El storefront guarda su carrito (debounced) para detectar abandono y poder
 * restaurarlo después con el enlace de recompra.
 *
 * Body: { pageId, clientId, items: [{id,name,price,qty,size?}], contact?, paymentMethod? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    const pageId = String(body.pageId || '').trim();
    const clientId = String(body.clientId || '').trim().slice(0, 120);
    const items = normalizeCartItems(body.items);

    if (!pageId) return apiError('pageId es requerido', 400);
    if (!clientId) return apiError('clientId es requerido', 400);
    if (items.length === 0) return apiError('El carrito está vacío', 400);

    // Solo matchear `id` si es un UUID válido (si no, Postgres lanza
    // "Inconsistent column data" y los slugs nunca resuelven).
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId);
    const page = await prisma.page.findFirst({
      where: { ...(isUuid ? { id: pageId } : { slug: pageId }), status: 'published' },
      include: { business: true },
    });
    if (!page) return apiError('Tienda no encontrada', 404);

    const session = await upsertCartSession({
      page,
      clientId,
      items,
      contact: body.contact || null,
      paymentMethod: body.paymentMethod || null,
    });

    return apiSuccess({ id: session.id, status: session.status }, 201);
  } catch (error) {
    console.error('[store/cart-sessions]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al guardar el carrito', 500);
  }
}
