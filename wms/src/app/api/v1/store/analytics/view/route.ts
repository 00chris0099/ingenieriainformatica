import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { trackGA4Event } from '@/lib/analytics-ga4';

/**
 * POST /api/v1/store/analytics/view — rastreo ligero de vistas del storefront.
 * Público: el negocio se resuelve de la página publicada. La fuente de tráfico
 * (referrer/utm) se deriva en el cliente y se normaliza aquí.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
    if (!pageId) return apiError('pageId es requerido', 400);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId);
    const page = await prisma.page.findFirst({
      where: isUuid ? { id: pageId, status: 'published' } : { slug: pageId, status: 'published' },
      select: { id: true, businessId: true },
    });
    if (!page) return apiError('Página no encontrada', 404);

    const rawReferrer = typeof body?.referrer === 'string' ? body.referrer.slice(0, 500) : '';
    let source = 'direct';
    if (rawReferrer) {
      try {
        const host = new URL(rawReferrer).hostname.toLowerCase().replace(/^www\./, '');
        if (host.includes('google.')) source = 'google';
        else if (host.includes('facebook.com') || host.includes('fb.')) source = 'facebook';
        else if (host.includes('instagram.com')) source = 'instagram';
        else if (host.includes('whatsapp.com') || host.includes('wa.me')) source = 'whatsapp';
        else if (host.includes('youtube.com') || host.includes('youtu.be')) source = 'youtube';
        else if (host.includes('tiktok.com')) source = 'tiktok';
        else if (host.includes('t.co') || host.includes('x.com') || host.includes('twitter.com')) source = 'twitter';
        else source = 'other';
      } catch {
        source = 'other';
      }
    }

    const business = await prisma.business.findUnique({ where: { id: page.businessId } });

    await prisma.pageView.create({
      data: {
        businessId: page.businessId,
        pageId: page.id,
        referrer: rawReferrer || null,
        source,
        utmSource: typeof body?.utm?.source === 'string' ? body.utm.source.slice(0, 100) : null,
        utmMedium: typeof body?.utm?.medium === 'string' ? body.utm.medium.slice(0, 100) : null,
        utmCampaign: typeof body?.utm?.campaign === 'string' ? body.utm.campaign.slice(0, 100) : null,
        device: body?.device === 'mobile' || body?.device === 'tablet' ? body.device : 'desktop',
      },
    });

    // GA4 Measurement Protocol: page_view server-side (fire-and-forget, con clientId del cliente)
    if (business) {
      trackGA4Event({
        business,
        eventName: 'page_view',
        clientId: typeof body?.clientId === 'string' && body.clientId ? body.clientId : undefined,
        params: { page_location: rawReferrer || undefined },
      });
    }

    return apiSuccess({ ok: true }, 201);
  } catch (error) {
    console.error('[store/analytics/view]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al registrar la vista', 500);
  }
}
