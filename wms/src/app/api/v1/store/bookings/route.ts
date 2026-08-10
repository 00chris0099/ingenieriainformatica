import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { notifyBookingCreated } from '@/lib/notifications/bookings';

export const dynamic = 'force-dynamic';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function googleCalendarUrl(opts: {
  businessName: string;
  date: string; // YYYY-MM-DD (local del cliente)
  time: string; // HH:MM
  durationMin: number;
  name: string;
  email?: string;
}) {
  const start = new Date(`${opts.date}T${opts.time}:00`);
  const end = new Date(start.getTime() + opts.durationMin * 60000);
  const fmt = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
  };
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Cita · ${opts.businessName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Cita reservada por ${opts.name}${opts.email ? ` (${opts.email})` : ''} a través de la página de ${opts.businessName}.`,
    sf: 'true',
    output: 'xml',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Público (sin auth): crear una cita en la agenda interna del negocio.
 * Valida: negocio activo, fecha dentro de los próximos 14 días, slot libre (409 si ocupado).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessSlug, date, time, name, phone, email, message, pageId, source } = body;

    if (!businessSlug) return apiError('El negocio es requerido', 400);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return apiError('Fecha inválida (YYYY-MM-DD)', 400);
    if (!time || !TIME_RE.test(time)) return apiError('Hora inválida (HH:MM)', 400);
    if (!name || !String(name).trim()) return apiError('El nombre es requerido', 400);
    if (!phone || !String(phone).trim()) return apiError('El teléfono es requerido', 400);

    // Fecha dentro de los próximos 14 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);
    const selected = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(selected.getTime()) || selected < today || selected > maxDate) {
      return apiError('Solo se permiten reservas dentro de los próximos 14 días', 400);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessSlug);
    const where: any = [{ slug: businessSlug }];
    if (isUuid) where.push({ id: businessSlug });

    const business = await prisma.business.findFirst({
      where: { OR: where, isActive: true },
      select: { id: true, name: true, slug: true, settings: true },
    });
    if (!business) return apiError('La tienda no existe o está inactiva', 404);

    // Slot libre (evitar doble reserva)
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const existing = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        date: { gte: dayStart, lte: dayEnd },
        slotTime: time,
        status: { in: ['confirmed', 'completed'] },
      },
      select: { id: true },
    });
    if (existing) {
      return apiError(`El horario ${time} ya está reservado. Elige otra hora.`, 409);
    }

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        pageId: pageId && /^[0-9a-f-]{36}$/i.test(pageId) ? pageId : null,
        date: dayStart,
        slotTime: time,
        customerName: String(name).trim(),
        customerEmail: email ? String(email).trim() : null,
        customerPhone: String(phone).trim(),
        message: message ? String(message).trim() : null,
        status: 'confirmed',
        source: source === 'calendly' || source === 'google' ? source : 'internal',
      },
    });

    // Notificaciones (no bloquean la respuesta)
    notifyBookingCreated(appointment, business, {
      notificationEmail: body.notificationEmail,
      notificationWhatsapp: body.notificationWhatsapp,
    }).catch((e) => console.error('[BOOKING NOTIFY]', (e as Error)?.message?.slice(0, 200)));

    const gcalUrl = googleCalendarUrl({
      businessName: business.name,
      date,
      time,
      durationMin: Number(body.duration) || 30,
      name: String(name).trim(),
      email: email ? String(email).trim() : undefined,
    });

    return apiSuccess({ booking: appointment, googleCalendarUrl: gcalUrl }, 201);
  } catch (error) {
    console.error('[BOOKINGS POST]', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al crear la cita: ${(error as Error)?.message?.slice(0, 200)}`, 500);
  }
}
