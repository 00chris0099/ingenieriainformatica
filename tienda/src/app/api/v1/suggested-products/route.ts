import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError, apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return apiError('product_id is required', 400);
    }

    const suggestedProducts = await prisma.suggestedProduct.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return apiSuccess(suggestedProducts);
  } catch (error) {
    return handleApiError(error, 'suggested-products-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, name, description, price, compareAtPrice, discountPercent, imageUrl, type, linkedProductId, sortOrder } = body;

    if (!productId || !name || price === undefined) {
      return apiError('productId, name, and price are required', 400);
    }

    const suggestedProduct = await prisma.suggestedProduct.create({
      data: {
        productId,
        name,
        description: description?.substring(0, 100) || null,
        price,
        compareAtPrice: compareAtPrice || null,
        discountPercent: discountPercent || 0,
        imageUrl: imageUrl || null,
        type: type || 'custom',
        linkedProductId: linkedProductId || null,
        sortOrder: sortOrder || 0,
      },
    });

    return apiSuccess(suggestedProduct, 201);
  } catch (error) {
    return handleApiError(error, 'suggested-products-create');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return apiError('id is required', 400);
    }

    if (data.description) {
      data.description = data.description.substring(0, 100);
    }

    const suggestedProduct = await prisma.suggestedProduct.update({
      where: { id },
      data,
    });

    return apiSuccess(suggestedProduct);
  } catch (error) {
    return handleApiError(error, 'suggested-products-update');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return apiError('id is required', 400);
    }

    await prisma.suggestedProduct.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'suggested-products-delete');
  }
}
