import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const identifier = params.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    const product = await prisma.product.findFirst({
      where: isUuid ? { id: identifier } : { slug: identifier },
      include: { category: true },
    });

    if (!product) return apiError('Product not found', 404);

    return apiSuccess({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      stock: product.stock,
      discountPercent: product.discountPercent ? Number(product.discountPercent) : null,
    });
  } catch (error) {
    return handleApiError(error, 'product-detail');
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    console.log('[API] PUT /api/v1/products/' + params.id, { price: body.price, discountPercent: body.discountPercent });
    const {
      name, slug: newSlug, model, description, shortDescription, categoryId, status, tags, images, brand,
      height, width, depth, color, materials, recommendedAge, warrantyDays, originCountry,
      weight, weightUnit, lowStockAlert, price, compareAtPrice, costPrice, stock, discountPercent, barcode,
    } = body;

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Product not found', 404);

    const slug = newSlug || (name ? name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug);

    const updated = await prisma.product.update({
      where: { id: params.id },
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
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Product not found', 404);

    await prisma.product.update({
      where: { id: params.id },
      data: { status: 'archived' },
    });

    await invalidateCache('products:*');
    return apiSuccess({ message: 'Product archived' });
  } catch (error) {
    return handleApiError(error, 'products-delete');
  }
}
