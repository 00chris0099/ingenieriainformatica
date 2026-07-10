import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiPaginated, apiError, parsePagination, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached('categories:all', () =>
      withDbFallback(
        async () => {
          const [categories, total] = await Promise.all([
            prisma.category.findMany({
              include: { _count: { select: { products: true } }, children: true },
              where: { parentId: null },
              orderBy: { sortOrder: 'asc' },
            }),
            prisma.category.count(),
          ]);
          return { categories, total };
        },
        () => ({ categories: [], total: 0 })
      ), 300
    );

    return apiPaginated(result.categories, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'categories-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, parentId, sortOrder, imageUrl } = body;

    if (!name) return apiError('Name is required', 400);

    const categorySlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        description: description || null,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        imageUrl: imageUrl || null,
      },
    });

    await invalidateCache('categories:*');

    return apiSuccess(category, 201);
  } catch (error: any) {
    if (error.code === 'P2002') return apiError('Category with this slug already exists', 409);
    return handleApiError(error, 'categories-create');
  }
}
