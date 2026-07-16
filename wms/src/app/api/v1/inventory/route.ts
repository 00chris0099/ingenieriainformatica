import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('low_stock') === 'true';
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`inventory:${page}:${limit}:${lowStock}:${search}`, () =>
      withDbFallback(
        async () => {
          const where: any = { status: { not: 'archived' } };
          if (search) {
            where.OR = [
              { sku: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ];
          }

          if (lowStock) {
            where.AND = [
              { stock: { lte: prisma.product.fields.lowStockAlert } },
            ];
          }

          const [products, total] = await Promise.all([
            prisma.product.findMany({
              where,
              include: { category: { select: { id: true, name: true } } },
              orderBy: { updatedAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.product.count({ where }),
          ]);
          return { products, total };
        },
        () => ({ products: [], total: 0 })
      ), 30
    );

    const mapped = result.products.map((p: any) => ({
      id: p.id,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      barcode: p.barcode,
      stock: p.stock,
      lowStockAlert: p.lowStockAlert,
      isLowStock: p.lowStockAlert != null && p.stock <= p.lowStockAlert,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      price: p.price,
      updatedAt: p.updatedAt,
    }));

    return apiPaginated(mapped, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'inventory-list');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, stock } = body;

    if (!productId) return apiError('productId is required', 400);
    if (stock === undefined) return apiError('stock is required', 400);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return apiError('Product not found', 404);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: Number(stock) },
    });

    await invalidateCache('inventory:*');
    await invalidateCache('products:*');

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'inventory-update');
  }
}
