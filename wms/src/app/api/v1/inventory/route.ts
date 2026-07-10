import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = getSearchParam(searchParams, 'warehouse_id');
    const lowStock = searchParams.get('low_stock') === 'true';
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`inventory:${page}:${limit}:${warehouseId}:${lowStock}:${search}`, () =>
      withDbFallback(
        async () => {
          const where: any = {};
          if (warehouseId) where.warehouseId = warehouseId;
          if (search) {
            where.OR = [
              { variant: { sku: { contains: search, mode: 'insensitive' } } },
              { variant: { name: { contains: search, mode: 'insensitive' } } },
            ];
          }

          const [inventory, total] = await Promise.all([
            prisma.inventory.findMany({
              where,
              include: {
                variant: { include: { product: true } },
                warehouse: true,
              },
              orderBy: { updatedAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.inventory.count({ where }),
          ]);
          return { inventory, total };
        },
        () => ({ inventory: [], total: 0 })
      ), 30
    );

    let filtered = result.inventory;
    if (lowStock) {
      filtered = filtered.filter((inv: any) => inv.availableQuantity <= inv.reorderPoint);
    }

    const mapped = filtered.map((inv: any) => ({
      id: inv.id,
      variantId: inv.variantId,
      variantSku: inv.variant.sku,
      variantName: inv.variant.name,
      productName: inv.variant.product?.name || 'Unknown',
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseCode: inv.warehouse.code,
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity: inv.availableQuantity,
      reorderPoint: inv.reorderPoint,
      reorderQuantity: inv.reorderQuantity,
      lastCountedAt: inv.lastCountedAt,
      updatedAt: inv.updatedAt,
    }));

    return apiPaginated(mapped, filtered.length, page, limit);
  } catch (error) {
    return handleApiError(error, 'inventory-list');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, warehouseId, quantity, reorderPoint, reorderQuantity } = body;

    if (!variantId || !warehouseId) return apiError('variantId and warehouseId are required', 400);

    const updated = await prisma.inventory.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      update: {
        ...(quantity !== undefined && { quantity }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(reorderQuantity !== undefined && { reorderQuantity }),
      },
      create: {
        variantId,
        warehouseId,
        quantity: quantity || 0,
        reorderPoint: reorderPoint || 10,
        reorderQuantity: reorderQuantity || 50,
      },
      include: { variant: true, warehouse: true },
    });

    await invalidateCache('inventory:*');

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'inventory-update');
  }
}
