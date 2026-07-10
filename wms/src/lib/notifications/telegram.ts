// Telegram Bot Notifications
// API Docs: https://core.telegram.org/bots/api

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export interface TelegramMessage {
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Bot token or chat ID not configured');
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message.text,
          parse_mode: message.parseMode || 'HTML',
        }),
      }
    );

    const result = await response.json();

    if (result.ok) {
      return { success: true };
    }

    console.error('[Telegram] Send failed:', result.description);
    return { success: false, error: result.description };
  } catch (error) {
    console.error('[Telegram] Network error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Notification Templates

export function newOrderNotification(order: {
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; quantity: number }>;
  paymentMethod: string;
}): string {
  const itemsList = order.items.map(item => `  • ${item.name} x${item.quantity}`).join('\n');
  return `📦 <b>NUEVO PEDIDO</b>

Pedido: <code>${order.orderNumber}</code>
Cliente: ${order.customerName}
Total: <b>S/ ${order.total}</b>
Pago: ${order.paymentMethod}

Productos:
${itemsList}

🔗 <a href="${process.env.NEXT_PUBLIC_WMS_URL || 'http://localhost:3000'}/pedidos">Ver en WMS</a>`;
}

export function paymentConfirmedNotification(order: {
  orderNumber: string;
  total: number;
  paymentId: string;
}): string {
  return `✅ <b>PAGO CONFIRMADO</b>

Pedido: <code>${order.orderNumber}</code>
Monto: <b>S/ ${order.total}</b>
Pago ID: ${order.paymentId}

El pedido esta listo para procesar.`;
}

export function lowStockNotification(product: {
  name: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
}): string {
  return `⚠️ <b>STOCK BAJO</b>

Producto: ${product.name}
SKU: <code>${product.sku}</code>
Stock actual: ${product.currentStock}
Punto de reorden: ${product.reorderPoint}

Requiere reabastecimiento.`;
}

export function dailySummaryNotification(stats: {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}): string {
  return `📊 <b>RESUMEN DEL DIA</b>

Pedidos hoy: ${stats.totalOrders}
Ingresos: <b>S/ ${stats.totalRevenue}</b>
Pendientes: ${stats.pendingOrders}`;
}
