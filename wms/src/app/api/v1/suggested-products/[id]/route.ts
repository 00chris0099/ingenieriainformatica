import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const existing = await prisma.suggestedProduct.findUnique({ where: { id } });
    if (!existing) return apiError('Suggested product not found', 404);

    await prisma.suggestedProduct.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'suggested-products-delete');
  }
}
