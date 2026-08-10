import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, apiPaginated, parsePagination, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const productId = searchParams.get('product_id');

    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    // Multi-tenant: el cliente solo ve ofertas de productos de sus tiendas
    if (!scope.isStaff) {
      where.product = { businessId: { in: scope.ids } };
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: { product: { select: { id: true, name: true, businessId: true } } },
        orderBy: { sortOrder: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return apiPaginated(offers, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'offers-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const { productId, name, price, type, description, quantity, linkedProductId, imageUrl, sortOrder, isActive, compareAtPrice, discountPercent } = body;

    if (!productId) return apiError('productId is required', 400);
    if (!name) return apiError('name is required', 400);
    if (price === undefined || price === null) return apiError('price is required', 400);
    if (!type) return apiError('type is required', 400);

    // Multi-tenant: la oferta solo puede apuntar a un producto de las tiendas del usuario
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, businessId: true },
    });
    if (!product) return apiError('Product not found', 404);
    if (!belongsToScope(product.businessId, scope)) {
      return apiError('Forbidden: el producto no pertenece a tus tiendas', 403);
    }

    const offer = await prisma.offer.create({
      data: {
        productId,
        name,
        price,
        type,
        description: description || null,
        quantity: quantity || 1,
        compareAtPrice: compareAtPrice ?? null,
        discountPercent: discountPercent ?? null,
        linkedProductId: linkedProductId || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return apiSuccess(offer, 201);
  } catch (error) {
    return handleApiError(error, 'offers-create');
  }
}
