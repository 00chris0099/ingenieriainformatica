import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

function safeParseJson(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { id } = await params;
    const identifier = id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    const product = await prisma.product.findFirst({
      where: isUuid ? { id: identifier } : { slug: identifier },
      include: { category: true },
    });

    if (!product) return apiError('Product not found', 404);
    if (!belongsToScope(product.businessId, scope)) {
      return apiError('Forbidden: este producto no pertenece a tus tiendas', 403);
    }

    return apiSuccess({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      stock: product.stock,
      discountPercent: product.discountPercent ? Number(product.discountPercent) : null,
      discountPopup: safeParseJson(product.discountPopup),
      promotionBar: safeParseJson(product.promotionBar),
      socialProof: safeParseJson(product.socialProof),
    });
  } catch (error) {
    return handleApiError(error, 'product-detail');
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const {
      name, slug: newSlug, model, description, shortDescription, categoryId, status, tags, images, brand,
      height, width, depth, color, materials, recommendedAge, warrantyDays, originCountry,
      weight, weightUnit, lowStockAlert, price, compareAtPrice, costPrice, stock, discountPercent, barcode,
      discountPopup, promotionBar, socialProof,
    } = body;
    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return apiError('Product not found', 404);
    if (!belongsToScope(existing.businessId, scope)) {
      return apiError('Forbidden: este producto no pertenece a tus tiendas', 403);
    }
    // El cliente no puede mover el producto a otra tienda
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { businessId: true } });
      if (!cat || !belongsToScope(cat.businessId, scope)) {
        return apiError('La categoría no pertenece a tus tiendas', 400);
      }
    }

    const slug = newSlug || (name ? name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(model !== undefined && { model }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(categoryId !== undefined && { categoryId }),
        ...(status && { status }),
        ...(tags && { tags }),
        ...(images && { images }),
        ...(brand !== undefined && { brand }),
        ...(height !== undefined && { height }),
        ...(width !== undefined && { width }),
        ...(depth !== undefined && { depth }),
        ...(color !== undefined && { color }),
        ...(materials && { materials }),
        ...(recommendedAge !== undefined && { recommendedAge }),
        ...(warrantyDays !== undefined && { warrantyDays }),
        ...(originCountry !== undefined && { originCountry }),
        ...(weight !== undefined && { weight }),
        ...(weightUnit && { weightUnit }),
        ...(lowStockAlert !== undefined && { lowStockAlert }),
        ...(price !== undefined && { price }),
        ...(compareAtPrice !== undefined && { compareAtPrice }),
        ...(costPrice !== undefined && { costPrice }),
        ...(stock !== undefined && { stock }),
        ...(discountPercent !== undefined && { discountPercent }),
        ...(barcode !== undefined && { barcode }),
        ...(discountPopup !== undefined && { discountPopup }),
        ...(promotionBar !== undefined && { promotionBar }),
        ...(socialProof !== undefined && { socialProof }),
      },
      include: { category: true },
    });

    await invalidateCache('products:*');
    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'products-update');
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return apiError('Product not found', 404);
    if (!belongsToScope(existing.businessId, scope)) {
      return apiError('Forbidden: este producto no pertenece a tus tiendas', 403);
    }

    await prisma.product.update({
      where: { id },
      data: { status: 'archived' },
    });

    await invalidateCache('products:*');
    return apiSuccess({ message: 'Product archived' });
  } catch (error) {
    return handleApiError(error, 'products-delete');
  }
}
