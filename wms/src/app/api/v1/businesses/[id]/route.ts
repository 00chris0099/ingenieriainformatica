import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { canAccessBusiness } from '@/lib/api/business-access';
import { sanitizeBusinessSettings } from '@/lib/payments/checkout';
import { isValidGaId } from '@/lib/analytics';

const ALLOWED_CURRENCIES = ['PEN', 'USD', 'MXN', 'COP', 'ARS', 'CLP', 'EUR', 'GBP'];

function cleanDomain(d: string): string {
  return d.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
}


export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    return apiSuccess({
      id: business.id,
      name: business.name,
      slug: business.slug,
      settings: sanitizeBusinessSettings(business.settings),
    });
  } catch (error) {
    return handleApiError(error, 'business-get');
  }
}

/**
 * PUT /api/v1/businesses/[id] — update payment & shipping settings.
 * Body (all optional): {
 *   whatsappNumber?: string,
 *   currency?: string,
 *   freeShippingThreshold?: number,
 *   defaultPaymentMethod?: 'mercadopago' | 'whatsapp',
 *   payments?: {
 *     mercadopago?: { enabled?: boolean, accessToken?: string },  // token vacío = conservar
 *     whatsapp?:    { enabled?: boolean },
 *   }
 * }
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    const current: any =
      business.settings && typeof business.settings === 'object' && !Array.isArray(business.settings)
        ? JSON.parse(JSON.stringify(business.settings))
        : {};

    const next = { ...current };

    if (body.whatsappNumber !== undefined) {
      const wa = String(body.whatsappNumber || '').replace(/[^\d+]/g, '');
      next.whatsappNumber = wa || null;
    }
    if (body.currency !== undefined) {
      const cur = String(body.currency || 'PEN').toUpperCase();
      if (!ALLOWED_CURRENCIES.includes(cur)) return apiError(`Moneda no soportada: ${cur}`, 400);
      next.currency = cur;
    }
    if (body.freeShippingThreshold !== undefined) {
      const t = Number(body.freeShippingThreshold);
      if (!Number.isFinite(t) || t < 0) return apiError('El umbral de envío gratis debe ser un número >= 0', 400);
      next.freeShippingThreshold = t;
    }
    if (body.defaultPaymentMethod !== undefined) {
      const m = String(body.defaultPaymentMethod);
      if (m !== 'mercadopago' && m !== 'whatsapp') return apiError('Método de pago inválido', 400);
      next.defaultPaymentMethod = m;
    }

    // ── payments.mercadopago ──
    const incomingMp = body?.payments?.mercadopago;
    if (incomingMp !== undefined) {
      const curMp = next.payments?.mercadopago && typeof next.payments.mercadopago === 'object' ? next.payments.mercadopago : {};
      const nextMp = { ...curMp };
      if (incomingMp.enabled !== undefined) nextMp.enabled = !!incomingMp.enabled;
      if (incomingMp.accessToken !== undefined) {
        const t = String(incomingMp.accessToken || '').trim();
        if (t) nextMp.accessToken = t; // token nuevo
        // vacío → conservar el actual
      }
      next.payments = { ...(next.payments || {}), mercadopago: nextMp };
    }

    // ── payments.whatsapp ──
    const incomingWa = body?.payments?.whatsapp;
    if (incomingWa !== undefined) {
      const curWa = next.payments?.whatsapp && typeof next.payments.whatsapp === 'object' ? next.payments.whatsapp : {};
      next.payments = { ...(next.payments || {}), whatsapp: { ...curWa, ...(incomingWa.enabled !== undefined ? { enabled: !!incomingWa.enabled } : {}) } };
    }

    // ── analytics (GA4 / Plausible) ──
    const incomingAn = body?.analytics;
    if (incomingAn !== undefined) {
      const curAn = next.analytics && typeof next.analytics === 'object' ? next.analytics : {};
      const nextAn = { ...curAn };
      if (incomingAn.enabled !== undefined) nextAn.enabled = !!incomingAn.enabled;
      if (incomingAn.googleAnalyticsId !== undefined) {
        const ga = String(incomingAn.googleAnalyticsId || '').trim();
        if (ga && !isValidGaId(ga)) return apiError(`ID de medición GA4 inválido: ${ga}`, 400);
        nextAn.googleAnalyticsId = ga || null;
      }
      if (incomingAn.plausibleDomain !== undefined) {
        const dom = cleanDomain(String(incomingAn.plausibleDomain || ''));
        if (dom && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(dom)) return apiError(`Dominio de Plausible inválido: ${dom}`, 400);
        nextAn.plausibleDomain = dom || null;
      }
      if (incomingAn.plausibleApiKey !== undefined) {
        const k = String(incomingAn.plausibleApiKey || '').trim();
        if (k) nextAn.plausibleApiKey = k; // vacío → conservar el actual
      }
      if (incomingAn.gaApiSecret !== undefined) {
        const s = String(incomingAn.gaApiSecret || '').trim();
        if (s) nextAn.gaApiSecret = s; // vacío → conservar el actual
      }
      next.analytics = nextAn;
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { settings: next },
    });

    return apiSuccess({
      id: updated.id,
      settings: sanitizeBusinessSettings(updated.settings),
      message: 'Configuración de pagos actualizada correctamente',
    });
  } catch (error) {
    return handleApiError(error, 'business-update');
  }
}
