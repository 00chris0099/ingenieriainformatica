import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import { expireStaleImpersonations } from '@/lib/impersonation';

/**
 * GET /api/v1/auth/impersonate/sessions
 * Lists active impersonation sessions (staff-only) for the super-admin
 * dashboard panel "Impersonaciones en curso" — who, on which client,
 * from what IP and time left.
 */
export async function GET(_request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const roleCheck = await requireRole('super_admin', 'admin');
    if (roleCheck.error) return roleCheck.error;

    await expireStaleImpersonations();

    const sessions = await prisma.impersonationSession.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      include: {
        admin: { select: { id: true, fullName: true, email: true } },
        target: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    const now = Date.now();
    return apiSuccess(
      sessions.map((s) => ({
        id: s.id,
        admin: s.admin,
        target: s.target,
        ipAddress: s.ipAddress,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        minutesLeft: Math.max(1, Math.ceil((new Date(s.expiresAt).getTime() - now) / 60000)),
        reason: s.reason,
        mode: s.mode || 'full',
        renewalCount: s.renewalCount || 0,
        lastRenewedAt: s.lastRenewedAt,
      })),
      200
    );
  } catch (error) {
    return handleApiError(error, 'impersonate-sessions-list');
  }
}

/** POST is not supported here. */
export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
