import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, parsePagination, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { hash } from 'bcryptjs';
import { requireAuth, requireRole, canManageUser } from '@/lib/api/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const result = await cached(`users:${page}:${limit}`, () =>
      prisma.user.findMany({
        select: {
          id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true,
          _count: { select: { businesses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }).then(async (users) => ({ users, total: await prisma.user.count() })),
      60
    );
    return apiSuccess(result);
  } catch (error) { return handleApiError(error, 'users-list'); }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return apiError('email, password and fullName are required', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError('Email already in use', 409);

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || 'readonly',
      },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });

    invalidateCache('users');
    return apiSuccess(user);
  } catch (error) { return handleApiError(error, 'user-create'); }
}
