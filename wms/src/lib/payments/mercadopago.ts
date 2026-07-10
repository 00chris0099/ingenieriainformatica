// MercadoPago Integration
// Docs: https://www.mercadopago.com.ar/developers/en/reference

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MP_BASE_URL = 'https://api.mercadopago.com/v1';

export interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MPPayment {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  external_reference: string;
}

// Create checkout preference
export async function createPreference(params: {
  title: string;
  quantity: number;
  unitPrice: number;
  orderId: string;
  currency?: string;
  backUrl?: string;
}): Promise<MPPreference> {
  const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{
        title: params.title,
        quantity: params.quantity,
        unit_price: params.unitPrice,
        currency_id: params.currency || 'PEN',
      }],
      external_reference: params.orderId,
      back_urls: {
        success: params.backUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${params.orderId}`,
        failure: params.backUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${params.orderId}`,
        pending: params.backUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pedido/${params.orderId}`,
      },
      auto_return: 'approved',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create MP preference');
  }

  return response.json();
}

// Get payment details
export async function getPayment(paymentId: string): Promise<MPPayment> {
  const response = await fetch(`${MP_BASE_URL}/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  });

  if (!response.ok) throw new Error('Failed to get MP payment');
  return response.json();
}

// Process webhook notification
export function validateWebhook(body: any, headers: any): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  // In production, validate HMAC signature
  return true;
}
