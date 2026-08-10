import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    try {
      const cacheKey = `orders:${page}:${limit}:${status}:${search}:${scope.isStaff ? 'all' : scope.ids.join(',')}`;

      const result = await cached(cacheKey, async () => {
        const where: any = {};
        if (!scope.isStaff) where.businessId = { in: scope.ids };
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { customer: { fullName: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where,
            include: {
              customer: true,
              items: true,
              _count: { select: { statusHistory: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          prisma.order.count({ where }),
        ]);
        return { orders, total };
      }, 30);

      const mapped = (result?.orders || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        source: o.source,
        customer: o.customer?.fullName || 'Unknown',
        customerId: o.customerId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        currency: o.currency,
        subtotal: Number(o.subtotal),
        discountAmount: Number(o.discountAmount),
        taxAmount: Number(o.taxAmount),
        shippingAmount: Number(o.shippingAmount),
        total: Number(o.total),
        itemsCount: o.items?.length || 0,
        placedAt: o.placedAt,
        confirmedAt: o.confirmedAt,
        shippedAt: o.shippedAt,
        deliveredAt: o.deliveredAt,
        createdAt: o.createdAt,
      }));

      return apiPaginated(mapped, result?.total || 0, page, limit);
    } catch {
      // DB unreachable — return empty paginated result, never crash with 500
      return apiPaginated([], 0, page, limit);
    }
  } catch (error) {
    return apiPaginated([], 0, 1, 10);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const body = await request.json();
    const { customerId, items, notes, internalNotes, source } = body;

    if (!items?.length) return apiError('At least one item is required', 400);

    // Multi-tenant: el pedido hereda la tienda de sus productos
    const productIds = items.map((i: any) => i.productId).filter(Boolean) as string[];
    let orderBusinessId: string | null = null;
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, businessId: true },
      });
      const bizSet = new Set(products.map((p) => p.businessId || '').filter(Boolean));
      if (bizSet.size > 1) {
        return apiError('Los productos del pedido pertenecen a tiendas distintas', 400);
      }
      orderBusinessId = bizSet.values().next().value || null;
      if (!scope.isStaff) {
        if (!orderBusinessId || !scope.ids.includes(orderBusinessId)) {
          return apiError('Forbidden: los productos no pertenecen a tus tiendas', 403);
        }
      }
    } else if (!scope.isStaff) {
      return apiError('Forbidden: el pedido debe incluir productos de tus tiendas', 403);
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    const discountAmount = items.reduce((sum: number, item: any) => sum + (item.discountAmount || 0), 0);
    const shippingAmount = subtotal >= 150 ? 0 : 10;
    const total = subtotal - discountAmount + shippingAmount;

    // Validar que el cliente exista de verdad (FK real, no ids de users)
    let resolvedCustomerId = customerId as string | undefined;
    if (resolvedCustomerId) {
      const existing = await prisma.customer.findUnique({
        where: { id: resolvedCustomerId },
        select: { id: true },
      });
      if (!existing) {
        return apiError('El cliente seleccionado no existe. Crea un cliente primero (Clientes → Nuevo Cliente).', 400);
      }
    } else {
      resolvedCustomerId = (await createGuestCustomer()).id;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    try {
      const count = await prisma.order.count();
      const orderNumber = `ADR-${dateStr}-${String(count + 1).padStart(5, '0')}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          source: source || 'wms',
          customerId: resolvedCustomerId,
          placedBy: user.id || null,
          businessId: orderBusinessId,
          status: 'confirmed',
          paymentStatus: 'pending',
          currency: 'PEN',
          subtotal,
          discountAmount,
          taxAmount: 0,
          shippingAmount,
          total,
          notes: notes || null,
          internalNotes: internalNotes || null,
          placedAt: now,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              productName: item.productName || item.name,
              sku: item.sku || 'N/A',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent || 0,
              discountAmount: item.discountAmount || 0,
              total: item.unitPrice * item.quantity - (item.discountAmount || 0),
            })),
          },
          statusHistory: {
            create: {
              toStatus: 'pending',
              changedByType: 'user',
            },
          },
        },
        include: { customer: true, items: true },
      });

      await invalidateCache('orders:*');

      return apiSuccess({
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        status: order.status,
      }, 201);
    } catch (error) {
      // Nunca devolver un pedido fantasma: superficie el error real para poder diagnosticar
      console.error('[orders] create failed:', (error as Error)?.message?.slice(0, 500));
      return apiError(`Error al guardar el pedido: ${(error as Error)?.message?.slice(0, 200) || 'desconocido'}`, 500);
    }
  } catch (error) {
    console.error('[orders] create unexpected:', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al crear pedido', 500);
  }
}

async function createGuestCustomer() {
  return prisma.customer.create({
    data: {
      source: 'wms',
      fullName: 'Cliente WMS',
      email: `guest-${Date.now()}@temp.com`,
    },
  });
}
