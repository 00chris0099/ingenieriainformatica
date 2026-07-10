import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    const where: any = { isActive: true };
    if (productId) where.productId = productId;

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return apiSuccess(offers);
  } catch (error) {
    return handleApiError(error, 'offers-list');
  }
}
