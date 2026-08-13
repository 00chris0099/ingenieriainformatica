import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { revokeAllSessionsExcept } from '@/lib/sessions';

/**
 * POST /api/v1/sessions/revoke-all
 * Revokes every active session of the current user EXCEPT the current one
 * (a leaked/stolen device is expelled; you stay logged in).
 */
export async function POST(_request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const currentId = typeof user.sid === 'string' ? user.sid : null;
    const count = await revokeAllSessionsExcept(user.id, currentId);
    return apiSuccess({ revokedCount: count }, 200);
  } catch (error) {
    return handleApiError(error, 'sessions-revoke-all');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
