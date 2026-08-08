import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { hash } from 'bcryptjs';
import { requireAuth, requireRole, canManageUser } from '@/lib/api/auth-guard';

interface Props { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
    });
    if (!user) return apiError('User not found', 404);
    return apiSuccess(user);
  } catch (error) { return handleApiError(error, 'user-detail'); }
}

export async function PUT(request: NextRequest, { params }: Props) {
  const { id } = await params;
  return updateHandler(request, id);
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  return updateHandler(request, id);
}

async function updateHandler(request: NextRequest, id: string) {
  try {
    const body = await request.json();
    const { fullName, role, isActive, password } = body;

    // Check if role is being changed — need admin privileges
    if (role !== undefined) {
      const manageCheck = await canManageUser(role);
      if (manageCheck.error) return manageCheck.error;
    } else {
      const authCheck = await requireAuth();
      if (authCheck.error) return authCheck.error;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return apiError('User not found', 404);

    // Prevent changing super_admin role
    if (existing.role === 'super_admin' && role && role !== 'super_admin') {
      return apiError('Cannot change super admin role', 403);
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await hash(password, 12);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    return apiSuccess(updated);
  } catch (error) { return handleApiError(error, 'user-update'); }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return apiError('User not found', 404);
    if (existing.role === 'super_admin') return apiError('Cannot delete super admin', 403);
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return apiSuccess({ message: 'User deactivated' });
  } catch (error) { return handleApiError(error, 'user-delete'); }
}
