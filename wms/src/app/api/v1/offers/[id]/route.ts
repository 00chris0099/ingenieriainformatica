import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { id } = await params;
    const offer = await prisma.offer.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'bundle',
        price: body.price,
        compareAtPrice: body.compareAtPrice ?? null,
        discountPercent: body.discountPercent ?? null,
        quantity: body.quantity ?? 1,
        linkedProductId: body.linkedProductId || null,
        imageUrl: body.imageUrl || null,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return apiSuccess(offer);
  } catch (error) { return handleApiError(error, 'offer-update'); }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await prisma.offer.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) { return handleApiError(error, 'offer-delete'); }
}
