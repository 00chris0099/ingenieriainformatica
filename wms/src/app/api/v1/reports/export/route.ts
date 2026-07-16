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
        { header: 'Precio', key: 'price', width: 15 },
        { header: 'Stock', key: 'stock', width: 15 },
        { header: 'Creado', key: 'createdAt', width: 20 },
      ];

      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });

      products.forEach((p) => {
        ws.addRow({
          sku: p.sku,
          name: p.name,
          category: p.category?.name || '-',
          status: p.status,
          price: Number(p.price || 0),
          stock: p.stock || 0,
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
        { header: 'Stock', key: 'stock', width: 12 },
        { header: 'Precio', key: 'price', width: 15 },
        { header: 'Alerta Stock Bajo', key: 'lowStockAlert', width: 15 },
      ];

      const products = await prisma.product.findMany({
        orderBy: { stock: 'asc' },
      });

      products.forEach((p) => {
        ws.addRow({
          sku: p.sku,
          product: p.name,
          stock: p.stock || 0,
          price: Number(p.price || 0),
          lowStockAlert: p.lowStockAlert || 0,
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
