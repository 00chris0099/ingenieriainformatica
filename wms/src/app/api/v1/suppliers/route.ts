import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = getSearchParam(searchParams, 'q');
    const { page, limit, offset } = parsePagination(searchParams);

    const result = await cached(`suppliers:${page}:${limit}:${search}`, () =>
      prisma.supplier.findMany({
        where: search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (suppliers) => ({
        suppliers,
        total: await prisma.supplier.count(),
      })),
      300
    );

    return apiPaginated(result.suppliers, result.total, page, limit);
  } catch (error) {
    return handleApiError(error, 'suppliers-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, supplierType, contactName, email, phone, country, currency, rating } = body;

    if (!name || !code) return apiError('Name and code are required', 400);

    const supplier = await prisma.supplier.create({
      data: {
        name, code,
        supplierType: supplierType || 'local',
        contactName, email, phone, country,
        currency: currency || 'PEN',
        rating,
      },
    });

    await invalidateCache('suppliers:*');
    return apiSuccess(supplier, 201);
  } catch (error: any) {
    if (error.code === 'P2002') return apiError('Supplier with this code already exists', 409);
    return handleApiError(error, 'suppliers-create');
  }
}
