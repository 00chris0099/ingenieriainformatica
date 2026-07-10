/**
 * Accounting Sync - Converts WMS data to accounting format
 * Supports Siigo (Peru) and generic CSV export
 */

import { prisma } from '@repo/prisma';
import { SiigoClient, SiigoInvoice, SiigoCustomer, SiigoProduct } from './siigo';

// ============================================================================
// WMS TO SIIGO CONVERSION
// ============================================================================

/**
 * Convert WMS Order to Siigo Invoice format
 */
export function wmsOrderToSiigoInvoice(order: any, config?: { sellerId?: number; warehouseId?: number }): SiigoInvoice {
  // Determine document type (Factura 9993 or Boleta 9995)
  const isFactura = order.customer?.taxId; // If has RUC, it's a Factura
  const documentCode = isFactura ? 9993 : 9995;

  return {
    document: { code: documentCode },
    date: new Date(order.createdAt).toISOString().split('T')[0],
    customer: {
      identification: order.customer?.taxId || order.customer?.dni || '00000000',
      check_digit: order.customer?.checkDigit || '',
      name: order.customer?.fullName || 'Cliente General',
      address: typeof order.billingAddress === 'object' 
        ? `${order.billingAddress.street || ''} ${order.billingAddress.city || ''}`
        : order.billingAddress || '',
      phone: order.customer?.phone || '',
      email: order.customer?.email || '',
    },
    items: order.items.map((item: any) => ({
      code: item.sku,
      description: item.productName,
      quantity: item.quantity,
      price: Number(item.unitPrice),
      discount: Number(item.discountAmount) || 0,
      tax: Number(item.taxAmount) || 0,
    })),
    payments: [{
      id: order.paymentStatus === 'paid' ? 1291 : 1292, // Efectivo or Tarjeta
      amount: Number(order.total),
    }],
    seller: config?.sellerId,
    warehouse: config?.warehouseId,
    observations: `Pedido: ${order.orderNumber}`,
  };
}

/**
 * Convert WMS Customer to Siigo Customer format
 */
export function wmsCustomerToSiigoCustomer(customer: any): SiigoCustomer {
  const hasTaxId = customer.taxId && customer.taxId.length > 0;
  
  return {
    identification_type: hasTaxId ? 'NIT' : 'CC',
    identification: customer.taxId || customer.dni || '00000000',
    name: customer.fullName,
    trade_name: customer.companyName || undefined,
    address: typeof customer.billingAddress === 'object'
      ? customer.billingAddress.street || ''
      : customer.billingAddress || '',
    phone: customer.phone || '',
    email: customer.email || '',
  };
}

/**
 * Convert WMS Product to Siigo Product format
 */
export function wmsProductToSiigoProduct(product: any, variant: any): SiigoProduct {
  return {
    code: variant.sku,
    name: `${product.name} - ${variant.name}`,
    description: product.description || variant.name,
    type: 'Product',
    category: product.category?.name || 'General',
    unit: 'UND',
    price: Number(variant.price),
    tax: 18, // IGV 18% in Peru
    stock: variant.inventory?.[0]?.quantity || 0,
  };
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync a single order to Siigo
 */
export async function syncOrderToSiigo(orderId: string): Promise<{ success: boolean; siigoId?: string; error?: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const siigo = new SiigoClient();
    const invoice = wmsOrderToSiigoInvoice(order);
    const result = await siigo.createInvoice(invoice);

    return { success: true, siigoId: result.id };
  } catch (error: any) {
    console.error('Error syncing order to Siigo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync a customer to Siigo
 */
export async function syncCustomerToSiigo(customerId: string): Promise<{ success: boolean; siigoId?: string; error?: string }> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    const siigo = new SiigoClient();
    const siigoCustomer = wmsCustomerToSiigoCustomer(customer);
    const result = await siigo.createCustomer(siigoCustomer);

    return { success: true, siigoId: result.id };
  } catch (error: any) {
    console.error('Error syncing customer to Siigo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync a product to Siigo
 */
export async function syncProductToSiigo(productId: string): Promise<{ success: boolean; siigoId?: string; error?: string }> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: { inventory: true },
        },
        category: true,
      },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const siigo = new SiigoClient();
    const results = [];

    for (const variant of product.variants) {
      const siigoProduct = wmsProductToSiigoProduct(product, variant);
      const result = await siigo.createProduct(siigoProduct);
      results.push(result);
    }

    return { success: true, siigoId: results[0]?.id };
  } catch (error: any) {
    console.error('Error syncing product to Siigo:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CSV EXPORT (Generic Accounting Software)
// ============================================================================

/**
 * Export invoices to CSV format
 */
export async function exportInvoicesToCSV(startDate: Date, endDate: Date): Promise<string> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: 'paid',
    },
    include: {
      customer: true,
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const headers = [
    'Fecha',
    'Numero Pedido',
    'Cliente',
    'RUC/DNI',
    'Subtotal',
    'IGV',
    'Total',
    'Estado',
    'Productos',
  ];

  const rows = orders.map((order) => [
    new Date(order.createdAt).toISOString().split('T')[0],
    order.orderNumber,
    order.customer?.fullName || '',
    order.customer?.taxId || '',
    Number(order.subtotal).toFixed(2),
    Number(order.taxAmount).toFixed(2),
    Number(order.total).toFixed(2),
    order.paymentStatus,
    order.items.map((i) => `${i.productName} x${i.quantity}`).join('; '),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Export products to CSV format
 */
export async function exportProductsToCSV(): Promise<string> {
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: { inventory: true },
      },
      category: true,
    },
    where: { status: 'active' },
  });

  const headers = [
    'SKU',
    'Producto',
    'Variante',
    'Categoria',
    'Precio',
    'Costo',
    'Stock',
    'Estado',
  ];

  const rows = products.flatMap((product) =>
    product.variants.map((variant) => [
      variant.sku,
      product.name,
      variant.name,
      product.category?.name || '',
      Number(variant.price).toFixed(2),
      Number(variant.costPrice || 0).toFixed(2),
      String(variant.inventory?.[0]?.quantity || 0),
      variant.isActive ? 'Activo' : 'Inactivo',
    ])
  );

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Export customers to CSV format
 */
export async function exportCustomersToCSV(): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Nombre',
    'Email',
    'Telefono',
    'RUC/DNI',
    'Empresa',
    'Direccion',
    'Saldo',
    'Limite Credito',
  ];

  const rows = customers.map((customer) => [
    customer.fullName,
    customer.email || '',
    customer.phone || '',
    customer.taxId || '',
    customer.companyName || '',
    typeof customer.billingAddress === 'object'
      ? customer.billingAddress.street || ''
      : customer.billingAddress || '',
    Number(customer.currentBalance).toFixed(2),
    Number(customer.creditLimit).toFixed(2),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}

/**
 * Export purchase orders to CSV format
 */
export async function exportPurchaseOrdersToCSV(startDate: Date, endDate: Date): Promise<string> {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      supplier: true,
      items: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const headers = [
    'Fecha',
    'Numero OC',
    'Proveedor',
    'Subtotal',
    'IGV',
    'Total',
    'Estado',
    'Productos',
  ];

  const rows = purchaseOrders.map((po) => [
    new Date(po.createdAt).toISOString().split('T')[0],
    po.poNumber,
    po.supplier?.name || '',
    Number(po.subtotal).toFixed(2),
    Number(po.taxAmount).toFixed(2),
    Number(po.total).toFixed(2),
    po.status,
    po.items.map((i) => `${i.sku} x${i.quantity}`).join('; '),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
}
