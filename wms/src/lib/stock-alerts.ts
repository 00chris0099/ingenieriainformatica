import { prisma } from '@repo/prisma';

export async function sendStockAlert(data: {
  productName: string;
  productSku: string;
  variantName: string;
  currentStock: number;
  threshold: number;
}): Promise<boolean> {
  const status = data.currentStock === 0 ? 'SIN STOCK' : 'STOCK BAJO';

  try {
    await prisma.notificationQueue.create({
      data: {
        subject: `Alerta Stock ${status}: ${data.productName}`,
        body: `SKU: ${data.productSku} | Variante: ${data.variantName} | Stock: ${data.currentStock} | Umbral: ${data.threshold}`,
        type: 'stock_alert',
      },
    });
    return true;
  } catch (error) {
    console.error('[StockAlert] Failed to create notification:', error);
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
