import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';
import { resolveAnalyticsConfig } from '@/lib/analytics';

/**
 * GET /api/v1/analytics/external?businessId=&days=
 * Métricas de fuentes externas para unificar con el embudo propio:
 * - Plausible: Stats API (visitors, pageviews, bounce, top páginas) cuando hay
 *   dominio + API key configurados.
 * - GA4: solo se reporta el estado (el script gtag ya recolecta en la página).
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') || '30')));
    const requestedBiz = searchParams.get('businessId');

    let businessId: string | null = null;
    if (scope.isStaff) {
      businessId = requestedBiz || null;
    } else {
      businessId = requestedBiz && scope.ids.includes(requestedBiz) ? requestedBiz : scope.ids[0] || null;
    }
    if (!businessId) {
      return apiSuccess({ configured: { ga4: false, plausible: false }, data: null });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return apiError('Tienda no encontrada', 404);

    const cfg = resolveAnalyticsConfig(business);
    const configured = {
      ga4: cfg.enabled && !!cfg.gaId,
      plausible: cfg.enabled && !!cfg.plausibleDomain && !!cfg.plausibleApiKey,
      gaId: cfg.gaId,
      plausibleDomain: cfg.plausibleDomain,
    };

    if (!configured.plausible) {
      return apiSuccess({ configured, data: null });
    }

    // ── Plausible Stats API ──
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const dateRange = `${start.toISOString().slice(0, 10)},${end.toISOString().slice(0, 10)}`;
    const headers = {
      Authorization: `Bearer ${cfg.plausibleApiKey}`,
      'Content-Type': 'application/json',
    };
    const base = `https://plausible.io/api/v1/stats`;

    const [aggRes, breakdownRes] = await Promise.all([
      fetch(
        `${base}/aggregate?site_id=${encodeURIComponent(cfg.plausibleDomain!)}&period=custom&date=${dateRange}&metrics=visitors,pageviews,bounce_rate,visit_duration`,
        { headers }
      ),
      fetch(
        `${base}/breakdown?site_id=${encodeURIComponent(cfg.plausibleDomain!)}&period=custom&date=${dateRange}&property=event:page&limit=5`,
        { headers }
      ),
    ]);

    if (!aggRes.ok) {
      const err = await aggRes.json().catch(() => null);
      return apiSuccess({
        configured,
        data: null,
        error: err?.error || `Plausible respondió ${aggRes.status}`,
      });
    }

    const agg = await aggRes.json();
    const breakdown = breakdownRes.ok ? (await breakdownRes.json()).results || [] : [];

    return apiSuccess({
      configured,
      data: {
        provider: 'plausible',
        domain: cfg.plausibleDomain,
        visitors: agg.results?.visitors?.value ?? 0,
        pageviews: agg.results?.pageviews?.value ?? 0,
        bounceRate: agg.results?.bounce_rate?.value ?? 0,
        visitDuration: agg.results?.visit_duration?.value ?? 0,
        topPages: breakdown.map((b: any) => ({ page: b.page, visitors: b.visitors, pageviews: b.pageviews })),
      },
    });
  } catch (error) {
    console.error('[analytics/external]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al consultar analytics externo', 500);
  }
}
