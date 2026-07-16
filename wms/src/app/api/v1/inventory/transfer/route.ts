import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromProductId, toProductId, quantity } = body;

    if (!fromProductId || !toProductId || !quantity) {
      return apiError('fromProductId, toProductId, and quantity are required', 400);
    }

    if (fromProductId === toProductId) {
      return apiError('Source and destination products must be different', 400);
    }

    const [source, destination] = await Promise.all([
      prisma.product.findUnique({ where: { id: fromProductId } }),
      prisma.product.findUnique({ where: { id: toProductId } }),
    ]);

    if (!source) return apiError('Source product not found', 404);
    if (!destination) return apiError('Destination product not found', 404);

    if (source.stock < quantity) {
      return apiError(`Insufficient stock. ${source.name} has ${source.stock} units`, 400);
    }

    await Promise.all([
      prisma.product.update({
        where: { id: fromProductId },
        data: { stock: { decrement: quantity } },
      }),
      prisma.product.update({
        where: { id: toProductId },
        data: { stock: { increment: quantity } },
      }),
    ]);

    await invalidateCache('inventory:*');
    await invalidateCache('products:*');

    return apiSuccess({
      message: `Transferred ${quantity} units from ${source.name} to ${destination.name}`,
      from: { id: source.id, name: source.name, newStock: source.stock - quantity },
      to: { id: destination.id, name: destination.name, newStock: destination.stock + quantity },
    });
  } catch (error) {
    return handleApiError(error, 'inventory-transfer');
  }
}
