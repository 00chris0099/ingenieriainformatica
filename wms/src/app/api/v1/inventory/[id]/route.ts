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
    const { quantity, reorderPoint } = body;

    const existing = await prisma.inventory.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Inventory record not found', 404);

    const updated = await prisma.inventory.update({
      where: { id: params.id },
      data: {
        ...(quantity !== undefined && { quantity, availableQuantity: quantity - (existing.reservedQuantity || 0) }),
        ...(reorderPoint !== undefined && { reorderPoint }),
      },
    });

    await invalidateCache('inventory:*');

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'inventory-update');
  }
}
