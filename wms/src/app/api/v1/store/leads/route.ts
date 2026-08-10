import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { trackGA4Event } from '@/lib/analytics-ga4';

/**
 * POST /api/v1/store/leads — captura de prospectos desde el bloque de contacto.
 * Público (sin sesión): el negocio se resuelve de la página publicada.
 * Body: { pageId, name, email?, phone?, message?, source?, utm? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    const pageId = typeof body?.pageId === 'string' ? body.pageId : '';
    if (!pageId) return apiError('pageId es requerido', 400);

    const page = await prisma.page.findFirst({
      where: { OR: [{ id: pageId }, { slug: pageId }], status: 'published' },
      select: { id: true, slug: true, title: true, businessId: true },
    });
    if (!page) return apiError('Página no encontrada', 404);

    const name = String(body?.name || '').trim().slice(0, 200);
    const email = String(body?.email || '').trim().toLowerCase().slice(0, 200);
    const phone = String(body?.phone || '').trim().slice(0, 60);
    const message = String(body?.message || '').trim().slice(0, 3000);
    if (!name) return apiError('El nombre es requerido', 400);
    if (!email && !phone) return apiError('Ingresa un email o teléfono', 400);

    const lead = await prisma.lead.create({
      data: {
        businessId: page.businessId,
        pageId: page.id,
        source: String(body?.source || 'contact').slice(0, 40),
        fullName: name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        metadata: {
          pageSlug: page.slug,
          pageTitle: page.title,
          url: typeof body?.url === 'string' ? body.url.slice(0, 500) : undefined,
          utm: body?.utm && typeof body.utm === 'object' ? body.utm : undefined,
        },
      },
    });

    // GA4 Measurement Protocol: evento lead (fire-and-forget)
    prisma.business
      .findUnique({ where: { id: page.businessId } })
      .then((business) => {
        if (business) {
          trackGA4Event({
            business,
            eventName: 'lead',
            userId: email || undefined,
            params: { lead_id: lead.id, lead_name: name, ...(email ? { email } : {}) },
          });
        }
      })
      .catch(() => {});

    // Notificación in-app al dueño/gestores (no bloquea la respuesta)
    prisma.userBusiness
      .findMany({
        where: { businessId: page.businessId },
        include: { user: { select: { id: true, email: true } } },
      })
      .then((owners) =>
        Promise.allSettled(
          owners.map((row) =>
            prisma.notificationQueue.create({
              data: {
                recipientId: row.user.id,
                recipientEmail: row.user.email,
                subject: `✨ Nuevo lead: ${name}`,
                body: [`✨ Nuevo prospecto en ${page.title}`, `👤 ${name}`, email ? `✉️ ${email}` : '', phone ? `📞 ${phone}` : '', message ? `📝 ${message}` : ''].filter(Boolean).join('\n'),
                channel: 'in-app',
                type: 'lead',
              },
            })
          )
        )
      )
      .catch((e) => console.error('[LEAD NOTIFY]', (e as Error)?.message?.slice(0, 150)));

    return apiSuccess({ id: lead.id }, 201);
  } catch (error) {
    console.error('[store/leads]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al guardar el lead', 500);
  }
}
