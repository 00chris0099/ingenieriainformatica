import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api';
import { getBusinessScope } from '@/lib/api/business-access';
import { cartShape, recoverAbandonedCarts } from '@/lib/carts';

/**
 * Carritos abandonados — dashboard multi-tenant.
 * GET  /api/v1/carts          → listado scoped (staff todo, cliente sus tiendas)
 * POST /api/v1/carts/recover  → barrido manual (ver carpeta recover/, ruta estática)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError('No autorizado', 401);

    const scope = await getBusinessScope(session.user);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const businessId = searchParams.get('businessId') || '';
    const q = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

    const where: any = {};
    if (status) where.status = status;
    if (businessId) {
      where.businessId = businessId;
    } else if (!scope.isStaff) {
      where.businessId = { in: scope.ids };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [rows, total, stats] = await Promise.all([
      prisma.abandonedCheckout.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: { business: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.abandonedCheckout.count({ where }),
      prisma.abandonedCheckout.groupBy({ by: ['status'], _count: { _all: true }, where }),
    ]);

    // Barrido fire-and-forget al abrir el panel.
    recoverAbandonedCarts({ ...(businessId ? { businessId } : {}) }).catch(() => {});

    const counts: Record<string, number> = {};
    for (const s of stats) counts[s.status] = s._count._all;
    counts.total = total;

    return apiSuccess({
      carts: rows.map(cartShape),
      total,
      counts,
      limit,
      offset,
      scoped: !scope.isStaff,
    });
  } catch (error) {
    console.error('[carts GET]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al listar carritos', 500);
  }
}

