import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import {
  expireStaleImpersonations,
  findActiveImpersonation,
} from '@/lib/impersonation';

/**
 * GET /api/v1/auth/impersonate/active
 * Returns the current admin's active impersonation record (if any), so the
 * /roles page can show a clear warning — including impersonations started
 * from another browser/device (server-side record).
 */
export async function GET(_request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const user = authCheck.user as any;
    const roleCheck = await requireRole('super_admin', 'admin');
    if (roleCheck.error) return roleCheck.error;

    await expireStaleImpersonations();
    const active = await findActiveImpersonation(user.id);

    if (!active) return apiSuccess({ active: null }, 200);

    return apiSuccess({
      active: {
        id: active.id,
        targetId: active.targetId,
        targetEmail: active.targetEmail,
        adminEmail: active.adminEmail,
        startedAt: active.startedAt,
        expiresAt: active.expiresAt,
        ipAddress: active.ipAddress,
        reason: active.reason,
        mode: active.mode || 'full',
        renewalCount: active.renewalCount || 0,
      },
    }, 200);
  } catch (error) {
    return handleApiError(error, 'impersonate-active');
  }
}

/** POST is not supported here. */
export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
