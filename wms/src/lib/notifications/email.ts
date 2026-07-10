// Email Service using Resend
// API Docs: https://resend.com/docs

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@adriskids.com';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[Email] Resend API key not configured, skipping email');
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, id: result.id };
    }

    console.error('[Email] Send failed:', result);
    return { success: false, error: result.message || 'Failed to send email' };
  } catch (error) {
    console.error('[Email] Network error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Email Templates

export function orderConfirmationEmail(order: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  shippingAddress: any;
}): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">S/ ${item.price}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:24px">ADRISU KIDS</h1>
        <p style="margin:5px 0 0;opacity:0.9">Confirmacion de Pedido</p>
      </div>
      <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb">
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Tu pedido <strong>${order.orderNumber}</strong> ha sido recibido exitosamente.</p>
        
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#e5e7eb">
              <th style="padding:8px;text-align:left">Producto</th>
              <th style="padding:8px;text-align:center">Cant.</th>
              <th style="padding:8px;text-align:right">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;font-weight:bold">Total</td>
              <td style="padding:8px;text-align:right;font-weight:bold;color:#16a34a">S/ ${order.total}</td>
            </tr>
          </tfoot>
        </table>

        <p style="color:#666;font-size:14px">
          <strong>Direccion de envio:</strong><br>
          ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.district || ''}, ${order.shippingAddress?.province || ''}
        </p>

        <div style="text-align:center;margin:20px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pedido?n=${order.orderNumber}" 
             style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">
             Seguir mi pedido
          </a>
        </div>
      </div>
      <div style="text-align:center;padding:10px;color:#999;font-size:12px">
        <p>ADRISU KIDS - Muebles para bebes</p>
      </div>
    </body>
    </html>
  `;
}

export function newOrderNotificationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
}): string {
  const itemsList = order.items.map(item => `• ${item.name} x${item.quantity}`).join('<br>');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f59e0b;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">📦 Nuevo Pedido Recibido</h1>
      </div>
      <div style="background:#fffbeb;padding:20px;border:1px solid #fde68a">
        <p><strong>Pedido:</strong> ${order.orderNumber}</p>
        <p><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</p>
        <p><strong>Total:</strong> <span style="color:#16a34a;font-weight:bold">S/ ${order.total}</span></p>
        <p><strong>Productos:</strong></p>
        <div style="background:white;padding:10px;border-radius:4px">${itemsList}</div>
        
        <div style="text-align:center;margin:20px 0">
          <a href="${process.env.NEXT_PUBLIC_WMS_URL || 'http://localhost:3000'}/pedidos" 
             style="background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">
             Ver en el WMS
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function orderStatusUpdateEmail(order: {
  orderNumber: string;
  customerName: string;
  status: string;
  statusLabel: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#16a34a;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:20px">📦 Actualizacion de Pedido</h1>
      </div>
      <div style="background:#f0fdf4;padding:20px;border:1px solid #bbf7d0">
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Tu pedido <strong>${order.orderNumber}</strong> ha cambiado de estado:</p>
        <div style="text-align:center;margin:20px 0">
          <span style="background:#16a34a;color:white;padding:8px 16px;border-radius:20px;font-weight:bold">${order.statusLabel}</span>
        </div>
        <div style="text-align:center;margin:20px 0">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pedido?n=${order.orderNumber}" 
             style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">
             Ver mi pedido
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}
