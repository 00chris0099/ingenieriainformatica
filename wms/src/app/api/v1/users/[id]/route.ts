import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { cached, invalidateCache } from '@/lib/cache';
import { hash } from 'bcryptjs';

interface Props { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) return apiError('User not found', 404);
    return apiSuccess(user);
  } catch (error) { return handleApiError(error, 'user-detail'); }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const { fullName, role, isActive, password } = body;
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('User not found', 404);

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await hash(password, 12);

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'user-update'); }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return apiError('User not found', 404);
    if (existing.role === 'super_admin') return apiError('Cannot delete super admin', 403);
    await prisma.user.update({ where: { id: params.id }, data: { isActive: false } });
    return apiSuccess({ message: 'User deactivated' });
  } catch (error) { return handleApiError(error, 'user-delete'); }
}
