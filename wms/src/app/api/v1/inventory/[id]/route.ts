import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { stock } = body;

    if (stock === undefined) return apiError('stock is required', 400);

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Product not found', 404);

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: { stock: Number(stock) },
    });

    await invalidateCache('inventory:*');
    await invalidateCache('products:*');

    return apiSuccess({
      id: updated.id,
      name: updated.name,
      sku: updated.sku,
      stock: updated.stock,
      lowStockAlert: updated.lowStockAlert,
      isLowStock: updated.lowStockAlert != null && updated.stock <= updated.lowStockAlert,
    });
  } catch (error) {
    return handleApiError(error, 'inventory-update');
  }
}
