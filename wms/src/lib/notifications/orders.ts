import { prisma } from '@repo/prisma';
import { sendEmail } from '@/lib/notifications/email';
import { whatsapp } from '@/lib/whatsapp/client';
import { currencySymbol } from '@/lib/payments/checkout';

interface OrderLike {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingAddress?: Record<string, any> | null;
  notes?: string | null;
  items: Array<{ productName: string; quantity: number; unitPrice?: number }>;
  placedAt?: Date | null;
}

interface BusinessLike {
  id: string;
  name: string;
  slug: string;
  settings?: any;
}

function paymentLabel(method?: string | null): string {
  if (method === 'mercadopago') return '💳 MercadoPago (tarjeta / Yape / Plin)';
  if (method === 'whatsapp') return '💬 WhatsApp (pago al recibir)';
  return '—';
}

function orderSummary(o: OrderLike, businessName: string): string {
  const symbol = currencySymbol(o.currency);
  const lines = (o.items || []).map((it) => `  • ${it.productName} x${it.quantity}`);
  return [
    `🛒 Nuevo pedido en ${businessName}`,
    `🧾 ${o.orderNumber}`,
    ...lines,
    `💰 Total: ${symbol} ${Number(o.total).toFixed(2)}`,
    `💳 ${paymentLabel(o.paymentMethod)}`,
    `👤 ${o.customerName}`,
    o.customerPhone ? `📞 ${o.customerPhone}` : '',
    o.customerEmail ? `✉️ ${o.customerEmail}` : '',
    o.notes ? `📝 ${o.notes}` : '',
  ].filter(Boolean).join('\n');
}

function orderEmailHtml(o: OrderLike, businessName: string): string {
  const color = '#2563eb';
  const symbol = currencySymbol(o.currency);
  const itemsRows = (o.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:14px">${it.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600">${symbol} ${(Number(it.unitPrice || 0) * it.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
      <div style="background:${color};color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
        <h1 style="margin:0;font-size:20px">🛒 Nuevo pedido recibido</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">${businessName}</p>
      </div>
      <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#e5e7eb">
              <th style="padding:8px;text-align:left;font-size:12px">Producto</th>
              <th style="padding:8px;text-align:center;font-size:12px">Cant.</th>
              <th style="padding:8px;text-align:right;font-size:12px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <table style="width:100%;font-size:14px;line-height:1.8;margin-top:16px">
          <tr><td style="color:#6b7280;width:110px">Pedido</td><td style="font-weight:700">${o.orderNumber}</td></tr>
          <tr><td style="color:#6b7280">Total</td><td style="font-weight:800;color:${color}">${symbol} ${Number(o.total).toFixed(2)}</td></tr>
          <tr><td style="color:#6b7280">Pago</td><td>${paymentLabel(o.paymentMethod)}</td></tr>
          <tr><td style="color:#6b7280">Cliente</td><td style="font-weight:600">${o.customerName}</td></tr>
          ${o.customerPhone ? `<tr><td style="color:#6b7280">Teléfono</td><td>${o.customerPhone}</td></tr>` : ''}
          ${o.customerEmail ? `<tr><td style="color:#6b7280">Email</td><td>${o.customerEmail}</td></tr>` : ''}
          ${o.shippingAddress?.street ? `<tr><td style="color:#6b7280;vertical-align:top">Dirección</td><td>${o.shippingAddress.street}</td></tr>` : ''}
          ${o.notes ? `<tr><td style="color:#6b7280;vertical-align:top">Notas</td><td>${o.notes}</td></tr>` : ''}
        </table>
        <p style="font-size:12px;color:#9ca3af;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px">
          Pedido del checkout de ${businessName} · ${o.placedAt ? new Date(o.placedAt).toLocaleString('es-PE') : ''} · ID ${o.id.slice(0, 8)}
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Notifica al dueño de la tienda cuando llega un pedido del checkout:
 * 1. Cola in-app (NotificationQueue) para los dueños/gestores de la tienda.
 * 2. Email (Resend) a los dueños (o el override configurado en el negocio).
 * 3. WhatsApp al número del negocio.
 * Fire-and-forget: los errores se registran pero nunca rompen el pedido.
 */
export async function notifyOrderCreated(
  order: OrderLike,
  business: BusinessLike,
  targets: { notificationEmail?: string; notificationWhatsapp?: string } = {}
): Promise<void> {
  const summary = orderSummary(order, business.name);

  let owners: Array<{ user: { id: string; email: string | null } }> = [];
  try {
    owners = await prisma.userBusiness.findMany({
      where: { businessId: business.id },
      include: { user: { select: { id: true, email: true } } },
    });
  } catch (e) {
    console.error('[ORDER NOTIFY owners]', (e as Error)?.message?.slice(0, 150));
  }

  // 1) Cola in-app → dueños/gestores asignados a la tienda
  try {
    for (const row of owners) {
      await prisma.notificationQueue.create({
        data: {
          recipientId: row.user.id,
          recipientEmail: row.user.email,
          subject: `🛒 Nuevo pedido ${order.orderNumber}`,
          body: summary,
          channel: 'in-app',
          type: 'order',
        },
      });
    }
  } catch (e) {
    console.error('[ORDER NOTIFY queue]', (e as Error)?.message?.slice(0, 150));
  }

  // 2) Email → override del negocio, si no a los dueños
  try {
    const bizSettings: any = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const emails = Array.from(new Set(owners.map((r) => r.user.email).filter(Boolean) as string[]));
    const emailOverride = targets.notificationEmail || bizSettings.notificationEmail;
    const to = emailOverride ? [String(emailOverride)] : emails;
    if (to.length > 0) {
      await sendEmail({
        to,
        subject: `🛒 Nuevo pedido ${order.orderNumber} — ${business.name}`,
        html: orderEmailHtml(order, business.name),
        replyTo: order.customerEmail || undefined,
      });
    }
  } catch (e) {
    console.error('[ORDER NOTIFY email]', (e as Error)?.message?.slice(0, 150));
  }

  // 3) WhatsApp → override del bloque, si no el número del negocio
  const waNumber = (
    targets.notificationWhatsapp ||
    (business.settings && typeof business.settings === 'object'
      ? business.settings.whatsappNumber || business.settings.whatsapp
      : '') ||
    ''
  )
    .toString()
    .replace(/\D/g, '');
  if (waNumber) {
    whatsapp.sendTextMessage(waNumber, summary).catch(() => {});
  }
}
