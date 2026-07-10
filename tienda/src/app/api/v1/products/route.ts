import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiPaginated, parsePagination, getSearchParam, handleApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const category = getSearchParam(searchParams, 'category');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = { status: 'active' };
    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return apiPaginated(products, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'store-products');
  }
}
