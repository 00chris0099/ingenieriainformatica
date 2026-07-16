import { prisma } from '@repo/prisma';

export async function sendStockAlert(data: {
  productName: string;
  productSku: string;
  currentStock: number;
  threshold: number;
}): Promise<boolean> {
  const status = data.currentStock === 0 ? 'SIN STOCK' : 'STOCK BAJO';

  try {
    await prisma.notificationQueue.create({
      data: {
        subject: `Alerta Stock ${status}: ${data.productName}`,
        body: `SKU: ${data.productSku} | Stock: ${data.currentStock} | Umbral: ${data.threshold}`,
        type: 'stock_alert',
      },
    });
    return true;
  } catch (error) {
    console.error('[StockAlert] Failed to create notification:', error);
    return false;
  }
}

export async function checkAndAlertStock(product: {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockAlert: number | null;
}): Promise<void> {
  if (!product.lowStockAlert) return;
  if (product.stock > product.lowStockAlert) return;

  await sendStockAlert({
    productName: product.name,
    productSku: product.sku,
    currentStock: product.stock,
    threshold: product.lowStockAlert,
  });
}
