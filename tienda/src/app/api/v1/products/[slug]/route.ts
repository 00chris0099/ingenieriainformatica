import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props { params: { slug: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!product || product.status !== 'active') return apiError('Product not found', 404);
    return apiSuccess({ ...product, priceConfig: product.priceConfig });
  } catch (error) { return handleApiError(error, 'store-product-detail'); }
}
