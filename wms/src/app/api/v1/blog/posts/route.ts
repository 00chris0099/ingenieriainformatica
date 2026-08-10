import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';
import { slugify, parseTags, isUuid } from '@/lib/blog';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const categoryId = getSearchParam(searchParams, 'categoryId');
    const businessId = getSearchParam(searchParams, 'businessId');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (!scope.isStaff) {
      where.businessId = { in: scope.ids };
    } else if (businessId && isUuid(businessId)) {
      where.businessId = businessId;
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          business: { select: { id: true, name: true, slug: true } },
          blogCategory: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return apiPaginated(posts, total, page, limit);
  } catch (error) {
    console.error('[BLOG POSTS GET]', (error as Error)?.message?.slice(0, 200));
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
    const { title, slug, content, excerpt, coverImage, tags, categoryId, businessId, isPublished, metaTitle, metaDescription, publishedAt } = body;

    if (!title) return apiError('El título es requerido', 400);
    if (!content) return apiError('El contenido del artículo es requerido', 400);

    let targetBusinessId = businessId || null;
    if (!targetBusinessId || !isUuid(targetBusinessId)) targetBusinessId = null;
    if (!scope.isStaff) {
      if (!targetBusinessId || !scope.ids.includes(targetBusinessId)) {
        return apiError('Forbidden: el artículo debe pertenecer a una de tus tiendas', 403);
      }
    }

    // Slug único por tienda
    let finalSlug = slugify(slug || title);
    if (targetBusinessId) {
      let candidate = finalSlug;
      let n = 2;
      while (await prisma.blogPost.findFirst({ where: { businessId: targetBusinessId, slug: candidate }, select: { id: true } })) {
        candidate = `${finalSlug}-${n++}`;
      }
      finalSlug = candidate;
    }

    // Categoría: validar que pertenezca a la tienda
    let categoryName: string | null = null;
    if (categoryId) {
      const cat = await prisma.blogCategory.findUnique({ where: { id: categoryId }, select: { id: true, name: true, businessId: true } });
      if (!cat) return apiError('La categoría no existe', 400);
      if (!belongsToScope(cat.businessId, scope)) return apiError('Forbidden: la categoría no pertenece a tus tiendas', 403);
      categoryName = cat.name;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        tags: parseTags(tags),
        categoryId: categoryId || null,
        category: categoryName,
        businessId: targetBusinessId,
        authorId: (user as any).id || null,
        isPublished: isPublished ?? false,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        blogCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    return apiSuccess(post, 201);
  } catch (error) {
    console.error('[BLOG POSTS POST]', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al crear el artículo: ${(error as Error)?.message?.slice(0, 200)}`, 500);
  }
}
