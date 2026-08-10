import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';
import { slugify, parseTags } from '@/lib/blog';

interface Props { params: Promise<{ id: string }> }

type GuardResult =
  | { ok: false; error: ReturnType<typeof apiError> }
  | { ok: false; notFound: true }
  | { ok: false; forbidden: true }
  | { ok: true; user: any; scope: { isStaff: boolean; ids: string[] }; post: { id: string; businessId: string | null } };

/** Guard de propiedad: staff pasa, cliente solo si el post es de una de sus tiendas. */
async function guardPost(id: string): Promise<GuardResult> {
  const authCheck = await requireAuth();
  if (authCheck.error) return { ok: false, error: authCheck.error };
  const user = authCheck.user as any;
  const scope = await getBusinessScope(user);

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, businessId: true },
  });
  if (!post) return { ok: false, notFound: true };
  if (!belongsToScope(post.businessId, scope)) return { ok: false, forbidden: true };
  return { ok: true, user, scope, post };
}

function rejectGuard(guard: GuardResult) {
  if (guard.ok) return null;
  if ('error' in guard && guard.error) return guard.error;
  if ('notFound' in guard && guard.notFound) return apiError('Artículo no encontrado', 404);
  return apiError('Forbidden: el artículo no pertenece a tus tiendas', 403);
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardPost(id);
    const rejected = rejectGuard(guard);
    if (rejected) return rejected;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, slug: true, logoUrl: true } },
        blogCategory: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, fullName: true, email: true } },
      },
    });
    return apiSuccess(post);
  } catch (error) {
    console.error('[BLOG POST GET]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al obtener el artículo', 500);
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardPost(id);
    const rejected = rejectGuard(guard);
    if (rejected) return rejected;
    if (!guard.ok) return apiError('Sin acceso', 403);
    const { scope, post: existingPost } = guard;

    const body = await request.json();
    const { title, slug, content, excerpt, coverImage, tags, categoryId, businessId, isPublished, metaTitle, metaDescription, publishedAt } = body;

    let targetBusinessId = body.businessId !== undefined ? body.businessId : existingPost.businessId;
    if (!targetBusinessId || !/^[0-9a-f-]{36}$/i.test(targetBusinessId)) targetBusinessId = existingPost.businessId;
    if (!scope.isStaff && !belongsToScope(targetBusinessId, scope)) {
      return apiError('Forbidden: la tienda no pertenece a tus tiendas', 403);
    }

    let finalSlug = slugify(slug || title || existingPost.id);
    if (targetBusinessId) {
      let candidate = finalSlug;
      let n = 2;
      while (await prisma.blogPost.findFirst({ where: { businessId: targetBusinessId, slug: candidate, NOT: { id } }, select: { id: true } })) {
        candidate = `${finalSlug}-${n++}`;
      }
      finalSlug = candidate;
    }

    let categoryName: string | null = null;
    if (categoryId) {
      const cat = await prisma.blogCategory.findUnique({ where: { id: categoryId }, select: { id: true, name: true, businessId: true } });
      if (!cat) return apiError('La categoría no existe', 400);
      if (!belongsToScope(cat.businessId, scope)) return apiError('Forbidden: la categoría no pertenece a tus tiendas', 403);
      categoryName = cat.name;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        slug: finalSlug,
        content: content !== undefined ? content : undefined,
        excerpt: excerpt !== undefined ? excerpt : null,
        coverImage: coverImage !== undefined ? coverImage : null,
        tags: parseTags(tags),
        categoryId: categoryId !== undefined ? categoryId : null,
        category: categoryName,
        businessId: targetBusinessId,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        metaTitle: metaTitle !== undefined ? metaTitle : null,
        metaDescription: metaDescription !== undefined ? metaDescription : null,
        publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : (publishedAt ? new Date(publishedAt) : null),
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        blogCategory: { select: { id: true, name: true, slug: true } },
      },
    });

    return apiSuccess(post);
  } catch (error) {
    console.error('[BLOG POST PUT]', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al actualizar el artículo: ${(error as Error)?.message?.slice(0, 200)}`, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardPost(id);
    const rejected = rejectGuard(guard);
    if (rejected) return rejected;

    await prisma.blogPost.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[BLOG POST DELETE]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al eliminar el artículo', 500);
  }
}
