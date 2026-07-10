import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromWarehouseId, toWarehouseId, variantId, quantity } = body;

    if (!fromWarehouseId || !toWarehouseId || !variantId || !quantity) {
      return apiError('fromWarehouseId, toWarehouseId, variantId, and quantity are required', 400);
    }

    if (fromWarehouseId === toWarehouseId) {
      return apiError('Source and destination warehouses must be different', 400);
    }

    // Check source has enough stock
    const sourceInventory = await prisma.inventory.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return apiError('Insufficient stock in source warehouse', 400);
    }

    // Decrease source
    await prisma.inventory.update({
      where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
      data: { quantity: { decrement: quantity } },
    });

    // Increase destination (upsert)
    await prisma.inventory.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId: toWarehouseId } },
      update: { quantity: { increment: quantity } },
      create: { variantId, warehouseId: toWarehouseId, quantity },
    });

    await invalidateCache('inventory:*');
    return apiSuccess({ message: `Transferred ${quantity} units from ${fromWarehouseId} to ${toWarehouseId}` });
  } catch (error) { return handleApiError(error, 'inventory-transfer'); }
}
