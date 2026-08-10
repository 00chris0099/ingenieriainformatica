import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { belongsToScope, getBusinessScope } from '@/lib/api/business-access';

interface Props { params: Promise<{ id: string }> }

/** Verifica que el usuario pueda tocar la oferta (staff o dueño de la tienda del producto). */
async function guardOfferAccess(id: string) {
  const authCheck = await requireAuth();
  if (authCheck.error) return { error: authCheck.error };
  const user = authCheck.user as any;
  const scope = await getBusinessScope(user);
  if (scope.isStaff) return { user, scope };

  const offer = await prisma.offer.findUnique({
    where: { id },
    select: { product: { select: { businessId: true } } },
  });
  if (!offer) return { notFound: true };
  if (!belongsToScope(offer.product?.businessId, scope)) {
    return { forbidden: true };
  }
  return { user, scope };
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardOfferAccess(id);
    if (guard.error) return guard.error;
    if (guard.notFound) return apiError('Offer not found', 404);
    if (guard.forbidden) return apiError('Forbidden: la oferta no pertenece a tus tiendas', 403);

    const body = await request.json();
    const offer = await prisma.offer.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        type: body.type || 'bundle',
        price: body.price,
        compareAtPrice: body.compareAtPrice ?? null,
        discountPercent: body.discountPercent ?? null,
        quantity: body.quantity ?? 1,
        linkedProductId: body.linkedProductId || null,
        imageUrl: body.imageUrl || null,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return apiSuccess(offer);
  } catch (error) { return handleApiError(error, 'offer-update'); }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const guard = await guardOfferAccess(id);
    if (guard.error) return guard.error;
    if (guard.notFound) return apiError('Offer not found', 404);
    if (guard.forbidden) return apiError('Forbidden: la oferta no pertenece a tus tiendas', 403);

    await prisma.offer.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) { return handleApiError(error, 'offer-delete'); }
}
