import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { listUserSessions } from '@/lib/sessions';

/**
 * GET /api/v1/sessions
 * Lists the authenticated user's ACTIVE sessions (devices) — used by
 * Configuración → Seguridad to revoke devices remotely.
 */
export async function GET(_request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const currentId = typeof user.sid === 'string' ? user.sid : null;
    const rows = await listUserSessions(user.id, currentId);
    return apiSuccess({ sessions: rows, currentId }, 200);
  } catch (error) {
    return handleApiError(error, 'sessions-list');
  }
}

/** POST is not supported here. */
export async function POST() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
