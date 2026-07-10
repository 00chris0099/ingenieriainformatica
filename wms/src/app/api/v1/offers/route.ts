import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, apiPaginated, parsePagination, handleApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        orderBy: { sortOrder: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.offer.count(),
    ]);

    return apiPaginated(offers, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'offers-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, type, minQuantity, discountPercent, fixedPrice, productId, sortOrder } = body;

    if (!name) return apiError('Name is required', 400);

    const offer = await prisma.offer.create({
      data: {
        name,
        description: description || null,
        type: type || 'bundle',
        minQuantity: minQuantity || 1,
        discountPercent: discountPercent || 0,
        fixedPrice: fixedPrice || null,
        productId: productId || null,
        sortOrder: sortOrder || 0,
      },
    });

    return apiSuccess(offer, 201);
  } catch (error) {
    return handleApiError(error, 'offers-create');
  }
}
