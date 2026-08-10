import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';
import { slugify } from '@/lib/blog';

interface Props { params: Promise<{ id: string }> }

async function guardCategory(id: string) {
  const authCheck = await requireAuth();
  if (authCheck.error) return { ok: false as const, error: authCheck.error };
  const user = authCheck.user as any;
  const scope = await getBusinessScope(user);

  const category = await prisma.blogCategory.findUnique({
    where: { id },
    select: { id: true, businessId: true },
  });
  if (!category) return { ok: false as const, notFound: true as const };
  if (!belongsToScope(category.businessId, scope)) return { ok: false as const, forbidden: true as const };
  return { ok: true as const, user, scope, category };
}

function rejectGuard(guard: Awaited<ReturnType<typeof guardCategory>>) {
  if (guard.ok) return null;
  if (guard.error) return guard.error;
  if ('notFound' in guard && guard.notFound) return apiError('Categoría no encontrada', 404);
  return apiError('Forbidden: la categoría no pertenece a tus tiendas', 403);
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardCategory(id);
    const rejected = rejectGuard(guard);
    if (rejected) return rejected;
    if (!guard.ok) return apiError('Sin acceso', 403);
    const { category: existing } = guard;

    const body = await request.json();
    const { name, description } = body;
    if (!name) return apiError('El nombre de la categoría es requerido', 400);

    let finalSlug = slugify(name);
    if (existing.businessId) {
      let candidate = finalSlug;
      let n = 2;
      while (await prisma.blogCategory.findFirst({ where: { businessId: existing.businessId, slug: candidate, NOT: { id } }, select: { id: true } })) {
        candidate = `${finalSlug}-${n++}`;
      }
      finalSlug = candidate;
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: {
        name,
        slug: finalSlug,
        description: description !== undefined ? description : null,
      },
    });

    return apiSuccess(category);
  } catch (error) {
    console.error('[BLOG CATEGORY PUT]', (error as Error)?.message?.slice(0, 300));
    return apiError(`Error al actualizar la categoría: ${(error as Error)?.message?.slice(0, 200)}`, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardCategory(id);
    const rejected = rejectGuard(guard);
    if (rejected) return rejected;

    await prisma.blogCategory.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[BLOG CATEGORY DELETE]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al eliminar la categoría', 500);
  }
}
