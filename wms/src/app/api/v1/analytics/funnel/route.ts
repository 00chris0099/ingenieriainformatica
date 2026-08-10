import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';

/**
 * GET /api/v1/analytics/funnel?days=30&businessId=
 * Embudo vistas → leads → pedidos → pagados, origen de tráfico, top páginas,
 * top productos y tendencia diaria. Scoped multi-tenant (cliente = sus tiendas).
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

    let businessIds: string[];
    if (scope.isStaff) {
      businessIds = requestedBiz ? [requestedBiz] : [];
    } else {
      businessIds = scope.ids;
      if (requestedBiz && scope.ids.includes(requestedBiz)) businessIds = [requestedBiz];
    }
    const allBusinesses = businessIds.length === 0;

    const where = allBusinesses ? {} : { businessId: { in: businessIds } };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const whereSince = { ...where, createdAt: { gte: startDate } };

    // ── Embudo (últimos N días) ──
    const [views, leads, orders, paidOrders] = await Promise.all([
      prisma.pageView.count({ where: whereSince }),
      prisma.lead.count({ where: whereSince }),
      prisma.order.count({ where: whereSince }),
      prisma.order.count({ where: { ...whereSince, paymentStatus: 'paid' } }),
    ]);

    const revenueAgg = await prisma.order.aggregate({
      where: { ...whereSince, paymentStatus: 'paid' },
      _sum: { total: true },
    });

    const rate = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

    // ── Tendencia diaria (agregación en JS sobre los últimos N días) ──
    const dailyViews = await prisma.pageView.findMany({ where: whereSince, select: { createdAt: true } });
    const dailyLeads = await prisma.lead.findMany({ where: whereSince, select: { createdAt: true } });
    const dailyOrders = await prisma.order.findMany({ where: whereSince, select: { createdAt: true } });

    const dailyMap: Record<string, { date: string; views: number; leads: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { date: key, views: 0, leads: 0, orders: 0 };
    }
    const keyOf = (d: Date) => d.toISOString().slice(0, 10);
    for (const v of dailyViews) if (dailyMap[keyOf(v.createdAt)]) dailyMap[keyOf(v.createdAt)]!.views++;
    for (const l of dailyLeads) if (dailyMap[keyOf(l.createdAt)]) dailyMap[keyOf(l.createdAt)]!.leads++;
    for (const o of dailyOrders) if (dailyMap[keyOf(o.createdAt)]) dailyMap[keyOf(o.createdAt)]!.orders++;
    const daily = Object.values(dailyMap);

    // ── Origen del tráfico ──
    const sourceGroups = await prisma.pageView.groupBy({
      by: ['source'],
      where: whereSince,
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const utmGroups = await prisma.pageView.groupBy({
      by: ['utmSource', 'utmMedium', 'utmCampaign'],
      where: { ...whereSince, utmSource: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    });

    // ── Top páginas (vistas, leads, conversión vista→lead) ──
    const [viewsByPage, leadsByPage] = await Promise.all([
      prisma.pageView.groupBy({
        by: ['pageId'],
        where: whereSince,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.lead.groupBy({ by: ['pageId'], where: { ...whereSince, pageId: { not: null } }, _count: { _all: true } }),
    ]);
    const leadCountByPage = new Map(leadsByPage.map((g) => [g.pageId, g._count._all]));
    const pageIds = viewsByPage.map((g) => g.pageId);
    const pages = pageIds.length > 0
      ? await prisma.page.findMany({ where: { id: { in: pageIds } }, select: { id: true, title: true, slug: true, type: true } })
      : [];
    const pageTitle = new Map(pages.map((p) => [p.id, p]));

    const topPages = viewsByPage.map((g) => {
      const pg = pageTitle.get(g.pageId);
      const pv = g._count._all;
      const lv = leadCountByPage.get(g.pageId) || 0;
      return {
        pageId: g.pageId,
        pageTitle: pg?.title || 'Página',
        pageSlug: pg?.slug || '',
        type: pg?.type || '',
        views: pv,
        leads: lv,
        leadRate: rate(lv, pv),
      };
    });

    // ── Top productos (pedidos pagados) ──
    const productGroups = await prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: { ...where, paymentStatus: 'paid' } },
      _count: { id: true },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });
    const topProducts = productGroups.map((g) => ({
      productName: g.productName,
      orders: g._count.id,
      quantity: g._sum.quantity || 0,
      total: Number(g._sum.total || 0),
    }));

    return apiSuccess({
      period: { days, start: startDate.toISOString().slice(0, 10) },
      funnel: {
        views,
        leads,
        orders,
        paidOrders,
        rates: {
          viewToLead: rate(leads, views),
          leadToOrder: rate(orders, leads),
          viewToPaid: rate(paidOrders, views),
        },
      },
      revenue: Number(revenueAgg._sum.total || 0),
      daily,
      sources: sourceGroups.map((g) => ({ source: g.source, views: g._count._all })),
      utm: utmGroups.map((g) => ({
        source: g.utmSource,
        medium: g.utmMedium,
        campaign: g.utmCampaign,
        views: g._count._all,
      })),
      topPages,
      topProducts,
    });
  } catch (error) {
    console.error('[analytics/funnel]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al calcular analytics', 500);
  }
}
