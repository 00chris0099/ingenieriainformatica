import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiPaginated, apiError, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    const cacheKey = `categories:${scope.isStaff ? 'all' : scope.ids.join(',')}`;
    const result = await cached(cacheKey, async () => {
      const where: any = { parentId: null };
      if (!scope.isStaff) where.businessId = { in: scope.ids };
      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          include: { _count: { select: { products: true } }, children: true },
          where,
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.category.count({ where }),
      ]);
      return { categories, total };
    }, 300);

    return apiPaginated(result.categories, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'categories-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const { name, slug, description, parentId, sortOrder, imageUrl } = body;

    if (!name) return apiError('Name is required', 400);

    // Multi-tenant: el cliente crea categorías dentro de sus tiendas
    let targetBusinessId: string | null = null;
    if (scope.isStaff) {
      targetBusinessId = body.businessId || null;
    } else {
      targetBusinessId = body.businessId && scope.ids.includes(body.businessId)
        ? body.businessId
        : scope.ids[0] || null;
      if (!targetBusinessId) {
        return apiError('No tienes tiendas asignadas. Contacta al administrador.', 403);
      }
    }

    let categorySlug = slug || slugify(name);
    // Evitar colisión de slug global entre tiendas: reintenta con sufijo del negocio
    try {
      const category = await prisma.category.create({
        data: {
          name,
          slug: categorySlug,
          businessId: targetBusinessId,
          description: description || null,
          parentId: parentId || null,
          sortOrder: sortOrder || 0,
          imageUrl: imageUrl || null,
        },
      });
      await invalidateCache('categories:*');
      return apiSuccess(category, 201);
    } catch (error: any) {
      if (error.code === 'P2002') {
        categorySlug = `${slugify(name)}-${(targetBusinessId || 'cat').slice(0, 6)}`;
        try {
          const category = await prisma.category.create({
            data: {
              name,
              slug: categorySlug,
              businessId: targetBusinessId,
              description: description || null,
              parentId: parentId || null,
              sortOrder: sortOrder || 0,
              imageUrl: imageUrl || null,
            },
          });
          await invalidateCache('categories:*');
          return apiSuccess(category, 201);
        } catch (e2: any) {
          if (e2.code === 'P2002') return apiError('Category with this slug already exists', 409);
          return handleApiError(e2, 'categories-create');
        }
      }
      return handleApiError(error, 'categories-create');
    }
    } catch (outerError: any) {
      return handleApiError(outerError, 'categories-create');
    }
}
