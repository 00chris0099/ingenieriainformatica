import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';

interface Props { params: Promise<{ id: string }> }

const PAGE_SELECT = {
  select: { id: true, title: true, slug: true, type: true, status: true, updatedAt: true },
} as const;

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { id } = await params;
    const self = (authCheck.user as any).id === id;
    const isStaff = ['super_admin', 'admin'].includes((authCheck.user as any).role);

    if (!self && !isStaff) {
      return apiError('Forbidden: cannot view other user assignments', 403);
    }

    const assignments = await prisma.userBusiness.findMany({
      where: { userId: id },
      include: {
        business: {
          include: {
            pages: PAGE_SELECT,
            _count: { select: { pages: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(assignments.map((a) => ({ ...a.business, assignedRole: a.role, assignedAt: a.createdAt })));
  } catch (error) {
    return handleApiError(error, 'user-businesses-list');
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const { id } = await params;
    const body = await request.json();
    const { businessId, role } = body;

    if (!businessId) return apiError('businessId is required', 400);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return apiError('User not found', 404);

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return apiError('Business not found', 404);

    const assignment = await prisma.userBusiness.upsert({
      where: { userId_businessId: { userId: id, businessId } },
      update: { role: role === 'manager' ? 'manager' : 'owner' },
      create: { userId: id, businessId, role: role === 'manager' ? 'manager' : 'owner' },
    });

    return apiSuccess(assignment, 201);
  } catch (error) {
    return handleApiError(error, 'user-business-assign');
  }
}
