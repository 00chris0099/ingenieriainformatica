const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendStockAlert(data: {
  productName: string;
  productSku: string;
  variantName: string;
  currentStock: number;
  threshold: number;
}): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[StockAlert] Telegram not configured');
    return false;
  }

  const status = data.currentStock === 0 ? 'SIN STOCK' : 'STOCK BAJO';
  const emoji = data.currentStock === 0 ? '\u26a0\ufe0f' : '\ud83d\udfe1';

  const message = [
    `${emoji} *Alerta de Stock - ${status}*`,
    '',
    `*Producto:* ${data.productName}`,
    `*SKU:* ${data.productSku}`,
    `*Variante:* ${data.variantName}`,
    `*Stock actual:* ${data.currentStock} unidades`,
    `*Umbral de alerta:* ${data.threshold} unidades`,
    '',
    `_Reponer stock lo antes posible_`,
  ].join('\n');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      console.error('[StockAlert] Telegram API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[StockAlert] Failed to send Telegram alert:', error);
    return false;
  }
}

export async function checkAndAlertStock(variant: {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockAlert: number | null;
  product: {
    name: string;
    sku: string;
  };
}): Promise<void> {
  if (!variant.lowStockAlert) return;
  if (variant.stock > variant.lowStockAlert) return;

  await sendStockAlert({
    productName: variant.product.name,
    productSku: variant.product.sku,
    variantName: variant.name,
    currentStock: variant.stock,
    threshold: variant.lowStockAlert,
  });
}
