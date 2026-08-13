import { prisma } from '@repo/prisma';
import { sendRecoveryNotifications } from '@/lib/notifications/carts';
import { currencySymbol, parsePrice } from '@/lib/payments/checkout';

/**
 * Abandoned-cart recovery.
 *
 * The storefront pushes its cart (localStorage) to the server as a "cart
 * session" (upsert per business + clientId). Sessions that stay untouched for
 * ABANDONED_CART_MINUTES (default 30) are detected by a sweep that notifies the
 * customer (email + WhatsApp) with a re-purchase link (?restore=<clientId>)
 * and queues an in-app alert for the store owner so they can follow up.
 *
 * The sweep runs fire-and-forget on every cart-session write and dashboard
 * listing, plus on demand (POST /api/v1/carts/recover) — no cron required.
 */

export interface CartSessionItem {
  id: string
  name: string
  price: number
  qty: number
  size?: string
  image?: string
}

export const ABANDONED_CART_MINUTES = Number(process.env.ABANDONED_CART_MINUTES) || 30

/** Tolerate junk from the client: keep sane items only. */
export function normalizeCartItems(raw: unknown): CartSessionItem[] {
  if (!Array.isArray(raw)) return []
  const out: CartSessionItem[] = []
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue
    const id = String((it as any).id || '').trim()
    const name = String((it as any).name || '').trim().slice(0, 200)
    if (!id || !name) continue
    const price = parsePrice((it as any).price)
    out.push({
      id,
      name,
      price: Number.isFinite(price) ? price : 0,
      qty: Math.max(1, Math.min(99, Number((it as any).qty) || 1)),
      size: (it as any).size ? String((it as any).size).slice(0, 40) : undefined,
      image: (it as any).image ? String((it as any).image).slice(0, 500) : undefined,
    })
    if (out.length >= 50) break
  }
  return out
}

export function cartSubtotal(items: CartSessionItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0)
}

export function cartCount(items: CartSessionItem[]): number {
  return items.reduce((sum, it) => sum + it.qty, 0)
}

export function recoveryBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WMS_URL ||
    process.env.WMS_URL ||
    'https://aimachristian-tiendawms.ajcxjb.easypanel.host'
  ).replace(/\/+$/, '')
}

/** Enlace de recompra: la tienda restaura el carrito desde ?restore=<clientId>. */
export function recoveryLink(pageSlug: string | null | undefined, clientId: string): string {
  const slug = (pageSlug || '').trim()
  return `${recoveryBaseUrl()}/p/${slug || ''}?restore=${encodeURIComponent(clientId)}`
}

/**
 * Upsert a cart session (public storefront). When a customer returns after
 * being notified, the session goes back to 'active' so the clock restarts.
 */
export async function upsertCartSession(opts: {
  page: any // published Page with business relation
  clientId: string
  items: CartSessionItem[]
  contact?: { name?: string; email?: string; phone?: string } | null
  paymentMethod?: string | null
}): Promise<any> {
  const { page, clientId, items } = opts
  const contact = opts.contact && typeof opts.contact === 'object' ? opts.contact : {}
  const subtotal = cartSubtotal(items)

  const existing = await prisma.abandonedCheckout.findUnique({
    where: { businessId_clientId: { businessId: page.businessId, clientId } },
  })

  const data: any = {
    businessId: page.businessId,
    pageId: page.id,
    clientId,
    pageSlug: page.slug || null,
    sessionId: existing?.sessionId || clientId,
    items,
    subtotal,
    total: subtotal,
    currency: String(
      (page.business?.settings && typeof page.business.settings === 'object'
        ? page.business.settings.currency
        : '') || 'PEN'
    ).toUpperCase(),
    paymentMethod: opts.paymentMethod || null,
    name: contact.name ? String(contact.name).slice(0, 120) : existing?.name || null,
    email: contact.email ? String(contact.email).toLowerCase().slice(0, 200) : existing?.email || null,
    phone: contact.phone ? String(contact.phone).slice(0, 40) : existing?.phone || null,
  }

  const session = await prisma.abandonedCheckout.upsert({
    where: { businessId_clientId: { businessId: page.businessId, clientId } },
    create: { ...data, status: 'active' },
    update: {
      ...data,
      // El cliente volvió: reiniciar el reloj de abandono (solo si no convirtió).
      ...(existing && existing.status !== 'converted' && existing.status !== 'recovered'
        ? { status: 'active', notifiedAt: null }
        : {}),
    },
  })

  // Barrido fire-and-forget: cualquier visita a la tienda activa la recuperación.
  recoverAbandonedCarts({ businessId: page.businessId }).catch((e) =>
    console.error('[CART RECOVER auto]', (e as Error)?.message?.slice(0, 150))
  )

  return session
}

/**
 * Sweep: detecta carritos sin actividad por >= minMinutes y notifica.
 * Devuelve cuántos recordatorios se enviaron.
 */
export async function recoverAbandonedCarts(opts: {
  businessId?: string
  minMinutes?: number
  limit?: number
} = {}): Promise<number> {
  const minMinutes = opts.minMinutes || ABANDONED_CART_MINUTES
  const cutoff = new Date(Date.now() - minMinutes * 60_000)

  const where: any = {
    status: 'active',
    notifiedAt: null,
    updatedAt: { lt: cutoff },
  }
  if (opts.businessId) where.businessId = opts.businessId

  const sessions = await prisma.abandonedCheckout.findMany({
    where,
    take: opts.limit || 50,
    orderBy: { updatedAt: 'asc' },
    include: { business: true },
  })

  let sent = 0
  for (const session of sessions) {
    try {
      const ok = await sendRecoveryForSession(session.id)
      if (ok) sent++
    } catch (e) {
      console.error('[CART RECOVER]', (e as Error)?.message?.slice(0, 150))
    }
  }
  return sent
}

/** Envía las notificaciones de recuperación de UNA sesión (con o sin espera de 30 min). */
export async function sendRecoveryForSession(id: string): Promise<boolean> {
  const session = await prisma.abandonedCheckout.findUnique({
    where: { id },
    include: { business: true },
  })
  if (!session || !session.business) return false

  const items = Array.isArray(session.items) ? (session.items as unknown as CartSessionItem[]) : []
  if (items.length === 0) return false

  await sendRecoveryNotifications(session, session.business, items)

  await prisma.abandonedCheckout.update({
    where: { id: session.id },
    data: { status: 'notified', notifiedAt: new Date() },
  })
  return true
}

/** Marca una sesión como convertida cuando el pedido se crea desde ella. */
export async function markCartConverted(opts: { businessId: string; clientId?: string | null; orderId: string }): Promise<void> {
  if (!opts.clientId) return
  await prisma.abandonedCheckout
    .updateMany({
      where: { businessId: opts.businessId, clientId: opts.clientId, status: { in: ['active', 'notified'] } },
      data: { status: 'converted', convertedAt: new Date(), orderId: opts.orderId },
    })
    .catch((e) => console.error('[CART CONVERTED]', (e as Error)?.message?.slice(0, 120)))
}

/** Formato público para el dashboard (nunca expone nada sensible). */
export function cartShape(session: any) {
  const items = Array.isArray(session.items) ? (session.items as unknown as CartSessionItem[]) : []
  return {
    id: session.id,
    clientId: session.clientId,
    pageSlug: session.pageSlug,
    name: session.name,
    email: session.email,
    phone: session.phone,
    items,
    count: cartCount(items),
    subtotal: Number(session.subtotal),
    currency: session.currency || 'PEN',
    symbol: currencySymbol(session.currency),
    status: session.status,
    notifiedAt: session.notifiedAt,
    recoveredAt: session.recoveredAt,
    convertedAt: session.convertedAt,
    orderId: session.orderId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    business: session.business ? { id: session.business.id, name: session.business.name, slug: session.business.slug } : null,
  }
}
