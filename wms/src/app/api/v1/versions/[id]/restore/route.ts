import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface Props {
  params: { id: string };
}

export async function POST(_request: NextRequest, { params }: Props) {
  try {
    const version = await prisma.productVersion.findUnique({
      where: { id: params.id },
    });

    if (!version) return apiError('Version not found', 404);

    const snapshot = version.snapshot as any;

    // Restore product from snapshot
    const restored = await prisma.product.update({
      where: { id: version.productId },
      data: {
        name: snapshot.name,
        model: snapshot.model,
        description: snapshot.description,
        shortDescription: snapshot.shortDescription,
        brand: snapshot.brand,
        status: snapshot.status,
        tags: snapshot.tags || [],
        images: snapshot.images || [],
        height: snapshot.height,
        width: snapshot.width,
        depth: snapshot.depth,
        color: snapshot.color,
        materials: snapshot.materials || [],
        recommendedAge: snapshot.recommendedAge,
        warrantyDays: snapshot.warrantyDays,
        originCountry: snapshot.originCountry,
        weight: snapshot.weight,
        weightUnit: snapshot.weightUnit,
        lowStockAlert: snapshot.lowStockAlert,
        price: snapshot.price,
        stock: snapshot.stock,
        discountPercent: snapshot.discountPercent,
        compareAtPrice: snapshot.compareAtPrice,
        costPrice: snapshot.costPrice,
        barcode: snapshot.barcode,
      },
      include: { category: true },
    });

    await invalidateCache('products:*');

    return apiSuccess({
      product: restored,
      restoredFromVersion: version.version,
      message: `Product restored to version ${version.version}`,
    });
  } catch (error) {
    return handleApiError(error, 'version-restore');
  }
}
