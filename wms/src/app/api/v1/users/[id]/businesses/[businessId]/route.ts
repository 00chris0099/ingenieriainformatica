import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireRole } from '@/lib/api/auth-guard';

interface Props { params: Promise<{ id: string; businessId: string }> }

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const { id, businessId } = await params;

    const deleted = await prisma.userBusiness.deleteMany({
      where: { userId: id, businessId },
    });

    if (deleted.count === 0) {
      return apiError('Assignment not found', 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'user-business-unassign');
  }
}
