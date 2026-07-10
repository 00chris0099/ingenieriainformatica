import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: {
          include: { inventory: { include: { warehouse: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) return apiError('Product not found', 404);

    return apiSuccess({
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        costPrice: v.costPrice ? Number(v.costPrice) : null,
        totalStock: v.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        inventory: v.inventory.map((inv) => ({
          warehouse: inv.warehouse.name,
          warehouseCode: inv.warehouse.code,
          quantity: inv.quantity,
          reserved: inv.reservedQuantity,
          available: inv.availableQuantity,
          reorderPoint: inv.reorderPoint,
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error, 'product-detail');
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    console.log('[API] PUT /api/v1/products/' + params.id, { enabledPriceTypes: body.enabledPriceTypes, prices: body.prices, variants: body.variants?.length });
    const {
      name, model, description, shortDescription, categoryId, status, tags, images, brand,
      height, width, depth, color, materials, recommendedAge, warrantyDays, originCountry,
      weight, weightUnit, lowStockAlert, discountPopup, variants, enabledPriceTypes, prices
    } = body;

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('Product not found', 404);

    // Update product fields
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
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
        ...(enabledPriceTypes && prices ? { priceConfig: { enabledTypes: enabledPriceTypes, especial: prices.especial, descuento: prices.descuento, mayorista: prices.mayorista } } : {}),
        ...(discountPopup !== undefined && { discountPopup }),
      },
      include: { category: true, variants: true },
    });

    // Handle variant updates if provided
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        console.log('[API] Processing variant:', { id: variant.id, name: variant.name, price: variant.price });
        try {
          if (variant.id && !variant.id.startsWith('new-')) {
            // Update existing variant
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                ...(variant.name && { name: variant.name }),
                ...(variant.price !== undefined && { price: variant.price }),
                ...(variant.compareAtPrice !== undefined && { compareAtPrice: variant.compareAtPrice }),
                ...(variant.isActive !== undefined && { isActive: variant.isActive }),
                ...(variant.lowStockAlert !== undefined && { lowStockAlert: variant.lowStockAlert }),
                ...(variant.images && { images: variant.images }),
                ...(variant.attributes && { attributes: variant.attributes }),
              },
            });
            console.log('[API] Variant updated:', variant.id);
          } else {
            // Create new variant
            const newVariant = await prisma.productVariant.create({
              data: {
                productId: params.id,
                sku: variant.sku || `${existing.sku}-V${Date.now()}`,
                name: variant.name || 'Nueva variante',
                price: variant.price || 0,
                compareAtPrice: variant.compareAtPrice || null,
                isActive: variant.isActive !== false,
                lowStockAlert: variant.lowStockAlert || null,
                images: variant.images || [],
                attributes: variant.attributes || {},
                sortOrder: variants.indexOf(variant),
              },
            });
            console.log('[API] New variant created:', newVariant.id);
          }
        } catch (err: any) {
          console.error('[API] Variant update error:', err.message);
        }
      }
    }

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

    // Soft delete - change status to archived
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
