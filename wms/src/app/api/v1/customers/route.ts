import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError, withDbFallback } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const customerType = getSearchParam(searchParams, 'type');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`customers:${page}:${limit}:${search}:${customerType}`, () =>
      withDbFallback(
        async () => {
          const where: any = {};
          if (customerType) where.customerType = customerType;
          if (search) {
            where.OR = [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { companyName: { contains: search, mode: 'insensitive' } },
              { taxId: { contains: search } },
            ];
          }
          const [customers, total] = await Promise.all([
            prisma.customer.findMany({
              where,
              include: {
                _count: { select: { orders: true, invoices: true } },
              },
              orderBy: { createdAt: 'desc' },
              skip: offset,
              take: limit,
            }),
            prisma.customer.count({ where }),
          ]);
          return { customers, total };
        },
        () => ({ customers: [], total: 0 })
      ), 30
    );

    const mapped = result.customers.map((c: any) => ({
      id: c.id,
      source: c.source,
      customerType: c.customerType,
      email: c.email,
      phone: c.phone,
      fullName: c.fullName,
      companyName: c.companyName,
      taxId: c.taxId,
      creditLimit: Number(c.creditLimit),
      currentBalance: Number(c.currentBalance),
      tags: c.tags,
      isActive: c.isActive,
      ordersCount: c._count.orders,
      invoicesCount: c._count.invoices,
      createdAt: c.createdAt,
    }));

    return apiPaginated(mapped, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'customers-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, customerType, companyName, taxId, creditLimit } = body;

    if (!fullName) return apiError('Full name is required', 400);

    const customer = await prisma.customer.create({
      data: {
        source: 'wms',
        fullName,
        email: email || `guest-${Date.now()}@temp.com`,
        phone: phone || null,
        password: 'guest',
      },
    });

    await invalidateCache('customers:*');

    return apiSuccess(customer, 201);
  } catch (error) {
    return handleApiError(error, 'customers-create');
  }
}
