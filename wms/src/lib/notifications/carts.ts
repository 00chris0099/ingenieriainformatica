import { prisma } from '@repo/prisma';
import { sendEmail } from '@/lib/notifications/email';
import { whatsapp } from '@/lib/whatsapp/client';
import { currencySymbol } from '@/lib/payments/checkout';
import { recoveryLink, cartSubtotal, cartCount, CartSessionItem } from '@/lib/carts';

/**
 * Recuperación de carritos abandonados — notifica al CLIENTE (email + WhatsApp)
 * con un enlace de recompra (?restore=clientId) y alerta al dueño en la cola
 * in-app para que haga seguimiento. Fire-and-forget por canal: un fallo nunca
 * rompe el resto.
 */
export async function sendRecoveryNotifications(
  session: any,
  business: any,
  items: CartSessionItem[]
): Promise<void> {
  const storeName = business.name || 'Mi Tienda'
  const symbol = currencySymbol(session.currency || 'PEN')
  const subtotal = Number(session.subtotal || cartSubtotal(items))
  const count = session.count || cartCount(items)
  const link = recoveryLink(session.pageSlug || business.slug, session.clientId || session.sessionId || '')

  // 1) Alerta in-app al dueño (siempre) — para seguimiento manual
  try {
    const summary = [
      `🛒 Carrito abandonado en ${storeName}`,
      `🧺 ${count} artículo(s) · 💰 ${symbol} ${subtotal.toFixed(2)}`,
      session.name ? `👤 ${session.name}` : '',
      session.email ? `✉️ ${session.email}` : '',
      session.phone ? `📞 ${session.phone}` : '',
      `🔗 Recompra: ${link}`,
    ].filter(Boolean).join('\n')

    const owners = await prisma.userBusiness.findMany({
      where: { businessId: business.id },
      include: { user: { select: { id: true, email: true } } },
    })
    for (const row of owners) {
      await prisma.notificationQueue.create({
        data: {
          recipientId: row.user.id,
          recipientEmail: row.user.email,
          subject: `🛒 Carrito abandonado — ${storeName}`,
          body: summary,
          channel: 'in-app',
          type: 'abandoned-cart',
        },
      })
    }
  } catch (e) {
    console.error('[CART NOTIFY queue]', (e as Error)?.message?.slice(0, 150))
  }

  // 2) Email al cliente con el enlace de recompra
  if (session.email) {
    try {
      const itemsRows = items
        .map(
          (it) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:14px">${it.name}${it.size ? ` <span style="color:#9ca3af">(${it.size})</span>` : ''}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px">${it.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600">${symbol} ${(it.price * it.qty).toFixed(2)}</td>
        </tr>`
        )
        .join('')
      const color = business.primaryColor || '#2563eb'

      await sendEmail({
        to: session.email,
        subject: `¡Tu carrito en ${storeName} te espera! 🛒`,
        html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
          <div style="background:${color};color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
            <h1 style="margin:0;font-size:20px">🛒 ¡No te olvides de tu carrito!</h1>
            <p style="margin:6px 0 0;opacity:.9;font-size:13px">${storeName}</p>
          </div>
          <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
            ${session.name ? `<p>Hola <strong>${session.name}</strong>,</p>` : '<p>Hola,</p>'}
            <p>Dejaste <strong>${count} artículo(s)</strong> en tu carrito y todavía están reservados para ti:</p>
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
            <p style="text-align:right;font-size:16px;font-weight:800;color:${color};margin:14px 0 20px">
              Total: ${symbol} ${subtotal.toFixed(2)}
            </p>
            <div style="text-align:center">
              <a href="${link}" style="display:inline-block;background:${color};color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
                Completar mi pedido →
              </a>
            </div>
            <p style="font-size:11px;color:#9ca3af;margin-top:18px;text-align:center">
              Si ya completaste tu compra, ignora este mensaje. · ${storeName}
            </p>
          </div>
        </body>
        </html>`,
      })
    } catch (e) {
      console.error('[CART NOTIFY email]', (e as Error)?.message?.slice(0, 150))
    }
  }

  // 3) WhatsApp al cliente con el enlace de recompra
  if (session.phone) {
    try {
      const lines = items
        .map((it) => `- ${it.name}${it.size ? ` (${it.size})` : ''} x${it.qty}`)
        .join('\n')
      const text = [
        `Hola${session.name ? ` ${session.name}` : ''}! 🛒 Te dejamos tu carrito en ${storeName}:`,
        '',
        lines,
        '',
        `Total: ${symbol} ${subtotal.toFixed(2)}`,
        '',
        `Completa tu pedido aquí: ${link}`,
      ].join('\n')
      await whatsapp.sendTextMessage(String(session.phone).replace(/\D/g, ''), text)
    } catch (e) {
      console.error('[CART NOTIFY wa]', (e as Error)?.message?.slice(0, 150))
    }
  }
}
