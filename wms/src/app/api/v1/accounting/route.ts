import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  syncOrderToSiigo,
  syncCustomerToSiigo,
  syncProductToSiigo,
  exportInvoicesToCSV,
  exportProductsToCSV,
  exportCustomersToCSV,
  exportPurchaseOrdersToCSV,
} from '@/lib/accounting/sync';

/**
 * POST - Sync data to Siigo or export to CSV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'sync_order': {
        const result = await syncOrderToSiigo(data.orderId);
        return NextResponse.json({ data: result });
      }

      case 'sync_customer': {
        const result = await syncCustomerToSiigo(data.customerId);
        return NextResponse.json({ data: result });
      }

      case 'sync_product': {
        const result = await syncProductToSiigo(data.productId);
        return NextResponse.json({ data: result });
      }

      case 'export_invoices': {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const csv = await exportInvoicesToCSV(startDate, endDate);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="facturas_${data.startDate}_${data.endDate}.csv"`,
          },
        });
      }

      case 'export_products': {
        const csv = await exportProductsToCSV();
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="productos.csv"',
          },
        });
      }

      case 'export_customers': {
        const csv = await exportCustomersToCSV();
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="clientes.csv"',
          },
        });
      }

      case 'export_purchase_orders': {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const csv = await exportPurchaseOrdersToCSV(startDate, endDate);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="ordenes_compra_${data.startDate}_${data.endDate}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Accounting sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get accounting sync status and config
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        siigo: {
          configured: !!(process.env.SIIGO_API_KEY && process.env.SIIGO_USERNAME),
          url: process.env.SIIGO_API_URL || 'https://api.sigo.com.co/v1',
        },
        exports: [
          { id: 'invoices', name: 'Facturas', description: 'Exportar facturas pagadas' },
          { id: 'products', name: 'Productos', description: 'Exportar catalogo de productos' },
          { id: 'customers', name: 'Clientes', description: 'Exportar base de clientes' },
          { id: 'purchase_orders', name: 'Ordenes de Compra', description: 'Exportar ordenes a proveedores' },
        ],
        syncOptions: [
          { id: 'sync_order', name: 'Sincronizar Pedido', description: 'Enviar pedido a Siigo como factura' },
          { id: 'sync_customer', name: 'Sincronizar Cliente', description: 'Enviar cliente a Siigo' },
          { id: 'sync_product', name: 'Sincronizar Producto', description: 'Enviar producto a Siigo' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching accounting config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
