import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';
import { slugify, isUuid } from '@/lib/blog';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const businessId = getSearchParam(searchParams, 'businessId');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (!scope.isStaff) {
      where.businessId = { in: scope.ids };
    } else if (businessId && isUuid(businessId)) {
      where.businessId = businessId;
    }

    const [categories, total] = await Promise.all([
      prisma.blogCategory.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, slug: true } },
          _count: { select: { posts: true } },
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.blogCategory.count({ where }),
    ]);

    return apiPaginated(categories, total, page, limit);
  } catch (error) {
    console.error('[BLOG CATEGORIES GET]', (error as Error)?.message?.slice(0, 200));
    return apiPaginated([], 0, 1, 10);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const { name, businessId, description } = body;
    if (!name) return apiError('El nombre de la categoría es requerido', 400);

    let targetBusinessId = businessId || null;
    if (!targetBusinessId || !isUuid(targetBusinessId)) targetBusinessId = null;
    if (!scope.isStaff) {
      if (!targetBusinessId || !scope.ids.includes(targetBusinessId)) {
        return apiError('Forbidden: la categoría debe pertenecer a una de tus tiendas', 403);
      }
    }

    let finalSlug = slugify(name);
    if (targetBusinessId) {
      let candidate = finalSlug;
      let n = 2;
      while (await prisma.blogCategory.findFirst({ where: { businessId: targetBusinessId, slug: candidate }, select: { id: true } })) {
        candidate = `${finalSlug}-${n++}`;
      }
      finalSlug = candidate;
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        businessId: targetBusinessId,
      },
    });

    return apiSuccess(category, 201);
  } catch (error) {
    console.error('[BLOG CATEGORIES POST]', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al crear la categoría: ${(error as Error)?.message?.slice(0, 200)}`, 500);
  }
}
