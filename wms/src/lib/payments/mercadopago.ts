// MercadoPago Integration
// Docs: https://www.mercadopago.com.ar/developers/en/reference

const MP_BASE_URL = 'https://api.mercadopago.com/v1';

export interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MPPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  id?: string;
}

export interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  external_reference: string;
}

/**
 * Create a Checkout Pro preference.
 * `accessToken` is resolved per business (store owner's own MP account) and
 * falls back to the global MERCADOPAGO_ACCESS_TOKEN env var.
 */
export async function createPreference(params: {
  items: MPPreferenceItem[];
  externalReference: string;
  backUrls?: { success?: string; failure?: string; pending?: string };
  autoReturn?: 'approved' | 'all';
  accessToken?: string | null;
}): Promise<MPPreference> {
  const token = params.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');

  const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      items: params.items.map((it) => ({
        ...(it.id ? { id: it.id } : {}),
        title: it.title,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        ...(it.currency_id ? { currency_id: it.currency_id } : {}),
      })),
      external_reference: params.externalReference,
      back_urls: {
        success: params.backUrls?.success,
        failure: params.backUrls?.failure,
        pending: params.backUrls?.pending,
      },
      auto_return: params.autoReturn || 'approved',
      notification_url: `${process.env.WMS_URL || process.env.NEXTAUTH_URL || ''}/api/v1/payments/mercadopago/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || error?.error || `MercadoPago ${response.status}`);
  }

  return response.json();
}

/** Get payment details. */
export async function getPayment(paymentId: string, accessToken?: string | null): Promise<MPPayment> {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');

  const response = await fetch(`${MP_BASE_URL}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to get MP payment');
  return response.json();
}

/**
 * Validate a MercadoPago webhook notification signature (HMAC-SHA256 over
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with the client secret).
 * Returns true when no secret is configured (degraded mode) — always pair it
 * with a server-side payment fetch, never trust the payload alone.
 */
export function validateWebhookSignature(headers: Headers, body: { data?: { id?: string } }, secret?: string | null): boolean {
  const s = secret || process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!s) return true;

  const signature = headers.get('x-signature') || '';
  const requestId = headers.get('x-request-id') || '';
  const tsMatch = signature.match(/ts=(\d+)/);
  const v1Match = signature.match(/v1=([0-9a-f]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1]!;
  const v1 = v1Match[1]!;
  const manifest = `id:${body?.data?.id || ''};request-id:${requestId};ts:${ts};`;

  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', s).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
