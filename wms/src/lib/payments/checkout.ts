/**
 * Checkout helpers for the public storefront.
 *
 * The storefront catalog lives inside the published page blocks (product-grid),
 * so the source of truth for prices is the PAGE CONTENT — never the client.
 * These helpers let the public order API re-resolve products/prices server-side
 * from the published page, which makes the checkout tamper-proof by design.
 */

/**
 * Parse a price label to a number. Tolerates: 'S/ 59.90', '$1,299.00' (US),
 * '1.299,00' (EU), bare numbers and empty labels.
 */
export function parsePrice(label: unknown): number {
  if (typeof label === 'number') return label
  const m = String(label || '').trim().match(/(\d[\d.,]*\d|\d)/)
  if (!m) return 0
  let s = m[1] || '0'
  if (s.includes(',')) {
    if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)) {
      // US thousands separator: 1,299.00 -> 1299.00
      s = s.replace(/,/g, '')
    } else if (s.indexOf(',') > s.indexOf('.')) {
      // EU decimal comma: 1.299,00 -> 1299.00
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(',', '.')
    }
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/** Map of ISO currency -> display symbol (defaults to S/ PEN) */
const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: 'S/',
  USD: '$',
  MXN: '$',
  COP: '$',
  ARS: '$',
  CLP: '$',
  EUR: '€',
  GBP: '£',
}

export function currencySymbol(currency?: string | null): string {
  return CURRENCY_SYMBOLS[(currency || 'PEN').toUpperCase()] || 'S/'
}

/**
 * Extract all products embedded in a published page's product-grid blocks,
 * indexed by String(id). Returns [] when the page has no catalog.
 */
export function extractPageProducts(page: any): Array<Record<string, any>> {
  const blocks: any[] = Array.isArray(page?.blocks) ? page.blocks : []
  return blocks
    .filter((b) => b?.type === 'product-grid' && Array.isArray(b?.content?.products))
    .flatMap((b) => b.content.products)
}

export function pageProductMap(page: any): Map<string, Record<string, any>> {
  const map = new Map<string, Record<string, any>>()
  for (const p of extractPageProducts(page)) {
    if (p && p.id != null) map.set(String(p.id), p)
  }
  return map
}

/** Generate an order number like ORD-20260810-4831 (collision-safe enough for storefront volume). */
export function generateOrderNumber(prefix = 'ORD'): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `${prefix}-${dateStr}-${rand}`
}

export interface PaymentConfig {
  currency: string
  whatsappNumber: string | null
  /** MercadoPago enabled + access token resolved (per-business or global env). */
  mpEnabled: boolean
  mpToken: string | null
  /** WhatsApp checkout enabled. */
  whatsappEnabled: boolean
}

/**
 * Resolve the payment config for a business from business.settings.payments:
 *   settings.payments = {
 *     mercadopago: { enabled?: boolean, accessToken?: string },
 *     whatsapp:    { enabled?: boolean }
 *   }
 * Falls back to global env (MERCADOPAGO_ACCESS_TOKEN) and page/business settings.
 */
export function resolvePaymentConfig(business: any, pageSettings: Record<string, any> = {}): PaymentConfig {
  const bizSettings: any = business?.settings && typeof business.settings === 'object' ? business.settings : {}
  const payments: any = bizSettings.payments && typeof bizSettings.payments === 'object' ? bizSettings.payments : {}

  const mpCfg = payments.mercadopago && typeof payments.mercadopago === 'object' ? payments.mercadopago : {}
  const waCfg = payments.whatsapp && typeof payments.whatsapp === 'object' ? payments.whatsapp : {}

  const mpToken: string | null =
    (typeof mpCfg.accessToken === 'string' && mpCfg.accessToken.trim() ? mpCfg.accessToken.trim() : null) ||
    (process.env.MERCADOPAGO_ACCESS_TOKEN || null)

  const whatsappNumber: string | null =
    bizSettings.whatsappNumber || pageSettings.whatsappNumber || null

  return {
    currency: String(bizSettings.currency || pageSettings.currency || 'PEN').toUpperCase(),
    whatsappNumber,
    mpEnabled: mpCfg.enabled !== false && !!mpToken,
    mpToken,
    whatsappEnabled: waCfg.enabled !== false && !!whatsappNumber,
  }
}

/** Never send the raw MP token to the browser — only a masked hint. */
export function maskToken(token?: string | null): string | undefined {
  if (!token) return undefined;
  if (token.length <= 8) return '••••••••';
  return `••••••••${token.slice(-4)}`;
}

/** Deep-sanitize business.settings before returning it to the client. */
export function sanitizeBusinessSettings(settings: any): any {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return settings || {};
  const copy = JSON.parse(JSON.stringify(settings));
  const mp = copy?.payments?.mercadopago;
  if (mp) {
    if (mp.accessToken) mp.accessTokenMasked = maskToken(String(mp.accessToken));
    delete mp.accessToken;
  }
  const an = copy?.analytics;
  if (an && typeof an === 'object') {
    if (an.plausibleApiKey) an.plausibleApiKeyMasked = maskToken(String(an.plausibleApiKey));
    delete an.plausibleApiKey;
    if (an.gaApiSecret) an.gaApiSecretMasked = maskToken(String(an.gaApiSecret));
    delete an.gaApiSecret;
  }
  return copy;
}

/** Build a wa.me deep link with the order summary. */
export function buildWhatsappOrderUrl(phone: string, order: any): string {
  const lines = (order.items || []).map(
    (it: any) => `- ${it.productName}${it.size ? ` (Talla: ${it.size})` : ''} x${it.quantity}`
  )
  const symbol = currencySymbol(order.currency)
  const message = [
    `Hola! Quiero completar mi pedido ${order.orderNumber}:`,
    ...lines,
    '',
    `Total: ${symbol} ${Number(order.total).toFixed(2)}`,
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
