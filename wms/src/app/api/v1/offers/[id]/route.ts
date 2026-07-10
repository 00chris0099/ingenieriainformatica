import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const offer = await prisma.offer.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'bundle',
        minQuantity: body.minQuantity || 1,
        discountPercent: body.discountPercent || 0,
        fixedPrice: body.fixedPrice || null,
        productId: body.productId || null,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return apiSuccess(offer);
  } catch (error) { return handleApiError(error, 'offer-update'); }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    await prisma.offer.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) { return handleApiError(error, 'offer-delete'); }
}
