import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: { locations: true },
    });
    if (!warehouse) return apiError('Warehouse not found', 404);
    return apiSuccess(warehouse);
  } catch (error) { return handleApiError(error, 'warehouse-detail'); }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { name, code, description, address, phone, isActive } = body;
    const existing = await prisma.warehouse.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Warehouse not found', 404);

    const updated = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    await invalidateCache('warehouses:*');
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'warehouse-update'); }
}
