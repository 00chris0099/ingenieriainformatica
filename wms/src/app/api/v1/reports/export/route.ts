import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'products';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ADRISU KIDS WMS';
    workbook.created = new Date();

    if (type === 'products') {
      const ws = workbook.addWorksheet('Productos');
      ws.columns = [
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Categoria', key: 'category', width: 20 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Variantes', key: 'variants', width: 10 },
        { header: 'Stock Total', key: 'stock', width: 15 },
        { header: 'Creado', key: 'createdAt', width: 20 },
      ];

      const products = await prisma.product.findMany({
        include: { category: true, variants: { include: { inventory: true } } },
        orderBy: { createdAt: 'desc' },
      });

      products.forEach((p) => {
        ws.addRow({
          sku: p.sku,
          name: p.name,
          category: p.category?.name || '-',
          status: p.status,
          variants: p.variants.length,
          stock: p.variants.reduce((sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0), 0),
          createdAt: p.createdAt.toISOString().split('T')[0],
        });
      });
    } else if (type === 'orders') {
      const ws = workbook.addWorksheet('Pedidos');
      ws.columns = [
        { header: 'Numero', key: 'orderNumber', width: 25 },
        { header: 'Cliente', key: 'customer', width: 25 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Fecha', key: 'date', width: 20 },
      ];

      const orders = await prisma.order.findMany({
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
      });

      orders.forEach((o) => {
        ws.addRow({
          orderNumber: o.orderNumber,
          customer: o.customer?.fullName || '-',
          status: o.status,
          total: Number(o.total),
          date: o.createdAt.toISOString().split('T')[0],
        });
      });
    } else if (type === 'inventory') {
      const ws = workbook.addWorksheet('Inventario');
      ws.columns = [
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Producto', key: 'product', width: 30 },
        { header: 'Almacen', key: 'warehouse', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Reservado', key: 'reserved', width: 12 },
        { header: 'Disponible', key: 'available', width: 12 },
        { header: 'Reorder', key: 'reorder', width: 10 },
      ];

      const inventory = await prisma.inventory.findMany({
        include: { variant: { include: { product: true } }, warehouse: true },
        orderBy: { updatedAt: 'desc' },
      });

      inventory.forEach((inv) => {
        ws.addRow({
          sku: inv.variant.sku,
          product: inv.variant.product?.name || '-',
          warehouse: inv.warehouse.name,
          quantity: inv.quantity,
          reserved: inv.reservedQuantity,
          available: inv.availableQuantity,
          reorder: inv.reorderPoint,
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=adriskids-${type}-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'export');
  }
}
