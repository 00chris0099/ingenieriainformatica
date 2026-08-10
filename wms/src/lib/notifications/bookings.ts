import { prisma } from '@repo/prisma';
import { sendEmail } from '@/lib/notifications/email';
import { whatsapp } from '@/lib/whatsapp/client';

interface BookingLike {
  id: string;
  businessId: string;
  date: Date;
  slotTime: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  message?: string | null;
  status: string;
  source: string;
}

interface NotifyTargets {
  notificationEmail?: string;
  notificationWhatsapp?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function bookingSummary(b: BookingLike, businessName: string): string {
  return [
    `Nueva cita reservada en ${businessName}`,
    `📅 ${formatDate(b.date)} a las ${b.slotTime}`,
    `👤 ${b.customerName}`,
    `📞 ${b.customerPhone}`,
    b.customerEmail ? `✉️ ${b.customerEmail}` : '',
    b.message ? `📝 ${b.message}` : '',
  ].filter(Boolean).join('\n');
}

function bookingEmailHtml(b: BookingLike, businessName: string): string {
  const color = '#2563eb';
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <div style="background:${color};color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px">Nueva cita reservada</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">${businessName}</p>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
        <table style="width:100%;font-size:14px;line-height:1.7">
          <tr><td style="padding:4px 0;color:#6b7280;width:110px">Fecha</td><td style="font-weight:600">${formatDate(b.date)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Hora</td><td style="font-weight:600">${b.slotTime}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Cliente</td><td style="font-weight:600">${b.customerName}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280">Teléfono</td><td>${b.customerPhone}</td></tr>
          ${b.customerEmail ? `<tr><td style="padding:4px 0;color:#6b7280">Email</td><td>${b.customerEmail}</td></tr>` : ''}
          ${b.message ? `<tr><td style="padding:4px 0;color:#6b7280;vertical-align:top">Mensaje</td><td>${b.message}</td></tr>` : ''}
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px">
          Cita ${b.source === 'internal' ? 'registrada en la agenda de la tienda' : `vía ${b.source}`} · ID ${b.id.slice(0, 8)}
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispara las notificaciones de una cita nueva:
 * 1. Cola in-app (NotificationQueue) para los dueños/gestores de la tienda.
 * 2. Email a los dueños (o al override del bloque).
 * 3. WhatsApp al número configurado del negocio (o override del bloque).
 * Fire-and-forget: los errores se registran pero nunca rompen la reserva.
 */
export async function notifyBookingCreated(
  booking: BookingLike,
  business: { id: string; name: string; slug: string; settings?: any },
  targets: NotifyTargets = {}
): Promise<void> {
  const summary = bookingSummary(booking, business.name);

  let owners: Array<{ user: { id: string; email: string | null } }> = [];
  try {
    owners = await prisma.userBusiness.findMany({
      where: { businessId: business.id },
      include: { user: { select: { id: true, email: true } } },
    });
  } catch (e) {
    console.error('[BOOKING NOTIFY owners]', (e as Error)?.message?.slice(0, 150));
  }

  // 1) Cola in-app → dueños/gestores asignados a la tienda
  try {
    for (const row of owners) {
      await prisma.notificationQueue.create({
        data: {
          recipientId: row.user.id,
          recipientEmail: row.user.email,
          subject: `Nueva cita · ${formatDate(booking.date)} ${booking.slotTime}`,
          body: summary,
          channel: 'in-app',
          type: 'booking',
        },
      });
    }
  } catch (e) {
    console.error('[BOOKING NOTIFY queue]', (e as Error)?.message?.slice(0, 150));
  }

  // 2) Email → override del bloque, si no a los dueños
  try {
    const emails = Array.from(new Set(owners.map((r) => r.user.email).filter(Boolean) as string[]));
    const emailOverride = targets.notificationEmail?.trim();
    const to = emailOverride ? [emailOverride] : emails;
    if (to.length > 0) {
      await sendEmail({
        to,
        subject: `Nueva cita · ${formatDate(booking.date)} ${booking.slotTime} — ${business.name}`,
        html: bookingEmailHtml(booking, business.name),
        replyTo: booking.customerEmail || undefined,
      });
    }
  } catch (e) {
    console.error('[BOOKING NOTIFY email]', (e as Error)?.message?.slice(0, 150));
  }

  // 3) WhatsApp → override del bloque, si no el número del negocio
  const waNumber = (targets.notificationWhatsapp || business.settings?.whatsappNumber || business.settings?.whatsapp || '').replace(/\D/g, '');
  if (waNumber) {
    whatsapp.sendTextMessage(waNumber, summary).catch(() => {});
  }
}
