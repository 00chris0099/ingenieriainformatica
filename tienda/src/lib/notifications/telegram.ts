// Telegram Bot Notifications
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(message: { text: string }): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { success: false, error: 'Telegram not configured' };
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message.text, parse_mode: 'HTML' }),
    });
    const result = await response.json();
    if (result.ok) return { success: true };
    return { success: false, error: result.description };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export function newOrderNotification(order: { orderNumber: string; customerName: string; total: number; items: Array<{ name: string; quantity: number }>; paymentMethod: string }): string {
  const itemsList = order.items.map(item => `  • ${item.name} x${item.quantity}`).join('\n');
  return `📦 <b>NUEVO PEDIDO</b>\n\nPedido: <code>${order.orderNumber}</code>\nCliente: ${order.customerName}\nTotal: <b>S/ ${order.total}</b>\nPago: ${order.paymentMethod}\n\nProductos:\n${itemsList}`;
}
