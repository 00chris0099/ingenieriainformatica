import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { canAccessBusiness } from '@/lib/api/business-access';
import { resolvePaymentConfig } from '@/lib/payments/checkout';

/**
 * POST /api/v1/businesses/[id]/payments/test
 * Verifica en vivo la cuenta de MercadoPago de la tienda contra la API real.
 * Body opcional: { accessToken?: string } — token candidato (aún no guardado).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const { id } = await params;
    if (!(await canAccessBusiness(user, id))) {
      return apiError('Forbidden: no tienes acceso a esta tienda', 403);
    }

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return apiError('Tienda no encontrada', 404);

    const body = await request.json().catch(() => ({}));
    const candidateToken =
      typeof body?.accessToken === 'string' && body.accessToken.trim() ? body.accessToken.trim() : null;

    // Token candidato (sin guardar aún) o el configurado para la tienda (o env global)
    const cfg = resolvePaymentConfig(business, {});
    const token = candidateToken || cfg.mpToken;

    if (!token) {
      return apiSuccess({
        ok: false,
        error: 'No hay token de MercadoPago configurado para esta tienda. Guárdalo primero o escribe uno para probar.',
      });
    }

    const started = Date.now();
    const res = await fetch('https://api.mercadopago.com/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      const detail = err?.message || err?.error || `HTTP ${res.status}`;
      return apiSuccess({
        ok: false,
        error: `Token rechazado por MercadoPago (${res.status}): ${detail}`,
        latencyMs: Date.now() - started,
      });
    }

    const me = await res.json();
    return apiSuccess({
      ok: true,
      accountLabel: me.nickname || me.email || `Usuario ${me.id}`,
      accountEmail: me.email || null,
      accountId: me.id != null ? String(me.id) : null,
      maskedToken: token.length > 8 ? `••••••••${token.slice(-4)}` : '••••••••',
      latencyMs: Date.now() - started,
      message: `Conexión exitosa como “${me.nickname || me.email || me.id}”`,
    });
  } catch (error) {
    return handleApiError(error, 'mp-test');
  }
}
