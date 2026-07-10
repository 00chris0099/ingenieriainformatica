import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const result = await cached(`users:${page}:${limit}`, () =>
      prisma.user.findMany({
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (users) => ({ users, total: await prisma.user.count() })),
      60
    );
    return apiSuccess(result);
  } catch (error) { return handleApiError(error, 'users-list'); }
}
