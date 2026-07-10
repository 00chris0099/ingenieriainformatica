import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: Props) {
  try {
    const original = await prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    if (!original) return apiError('Product not found', 404);

    // Generate new SKU with sequence
    const prefix = original.sku.split('-')[0] || 'ADK';
    const count = await prisma.product.count();
    const newSku = `${prefix}-COPY-${String(count + 1).padStart(3, '0')}`;

    // Generate new slug
    const newSlug = `${original.slug}-copia-${Date.now()}`;

    // Create duplicate with all fields
    const duplicate = await prisma.product.create({
      data: {
        sku: newSku,
        name: `${original.name} (Copia)`,
        slug: newSlug,
        model: original.model,
        description: original.description,
        shortDescription: original.shortDescription,
        brand: original.brand,
        categoryId: original.categoryId,
        status: 'draft',
        tags: [...original.tags],
        images: [...original.images],
        height: original.height,
        width: original.width,
        depth: original.depth,
        color: original.color,
        materials: [...original.materials],
        recommendedAge: original.recommendedAge,
        warrantyDays: original.warrantyDays,
        originCountry: original.originCountry,
        weight: original.weight,
        weightUnit: original.weightUnit,
        lowStockAlert: original.lowStockAlert,
        discountPopup: original.discountPopup,
        variants: {
          create: original.variants.map((v, i) => ({
            sku: `${newSku}-V${i + 1}`,
            name: v.name,
            attributes: v.attributes,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            costPrice: v.costPrice,
            barcode: v.barcode,
            images: [...v.images],
            isActive: v.isActive,
            lowStockAlert: v.lowStockAlert,
            sortOrder: v.sortOrder,
          })),
        },
      },
      include: { category: true, variants: true },
    });

    await invalidateCache('products:*');

    return apiSuccess({
      id: duplicate.id,
      sku: duplicate.sku,
      name: duplicate.name,
      message: 'Product duplicated successfully',
    }, 201);
  } catch (error) {
    return handleApiError(error, 'product-duplicate');
  }
}
