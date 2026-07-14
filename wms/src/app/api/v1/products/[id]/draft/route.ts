import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';

interface Props {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Product not found', 404);

    const body = await request.json();

    // Update product with draft data
    const priceConfigUpdate = (body.enabledPriceTypes && body.prices) || body.ctaText || body.crossSellProductIds ? {
      priceConfig: {
        ...(existing.priceConfig as any || {}),
        ...(body.enabledPriceTypes && body.prices ? {
          enabledTypes: body.enabledPriceTypes,
          especial: body.prices.especial,
          descuento: body.prices.descuento,
          mayorista: body.prices.mayorista,
        } : {}),
        ...(body.ctaText !== undefined && { ctaText: body.ctaText }),
        ...(body.crossSellProductIds !== undefined && { crossSellProductIds: body.crossSellProductIds }),
      },
    } : {};

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.model !== undefined && { model: body.model }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.images !== undefined && { images: body.images }),
        ...(body.height !== undefined && { height: body.height }),
        ...(body.width !== undefined && { width: body.width }),
        ...(body.depth !== undefined && { depth: body.depth }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.materials !== undefined && { materials: body.materials }),
        ...(body.recommendedAge !== undefined && { recommendedAge: body.recommendedAge }),
        ...(body.warrantyDays !== undefined && { warrantyDays: body.warrantyDays }),
        ...(body.originCountry !== undefined && { originCountry: body.originCountry }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.weightUnit !== undefined && { weightUnit: body.weightUnit }),
        ...(body.lowStockAlert !== undefined && { lowStockAlert: body.lowStockAlert }),
        ...(body.discountPopup !== undefined && { discountPopup: body.discountPopup }),
        ...priceConfigUpdate,
      },
      include: { category: true, variants: true },
    });

    // Handle variant updates if provided
    if (body.variants && Array.isArray(body.variants)) {
      for (const variant of body.variants) {
        try {
          if (variant.id && !variant.id.startsWith('new-') && variant.id.length > 10) {
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                ...(variant.name !== undefined && { name: variant.name }),
                ...(variant.price !== undefined && { price: variant.price }),
                ...(variant.compareAtPrice !== undefined && { compareAtPrice: variant.compareAtPrice }),
                ...(variant.isActive !== undefined && { isActive: variant.isActive }),
                ...(variant.images !== undefined && { images: variant.images }),
                ...(variant.attributes !== undefined && { attributes: variant.attributes }),
              },
            });
          } else {
            await prisma.productVariant.create({
              data: {
                productId: params.id,
                sku: variant.sku || `${existing.sku}-V${Date.now()}`,
                name: variant.name || 'Nueva oferta',
                price: variant.price || 0,
                compareAtPrice: variant.compareAtPrice || null,
                isActive: variant.isActive !== false,
                images: variant.images || [],
                attributes: variant.attributes || {},
                sortOrder: body.variants.indexOf(variant),
              },
            });
          }
        } catch {}
      }
    }

    return apiSuccess({
      id: updated.id,
      lastSaved: new Date().toISOString(),
      message: 'Draft saved',
    });
  } catch (error) {
    return handleApiError(error, 'product-draft-save');
  }
}
