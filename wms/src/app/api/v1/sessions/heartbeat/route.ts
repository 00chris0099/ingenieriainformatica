import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { touchSessionRecord } from '@/lib/sessions';

/**
 * POST /api/v1/sessions/heartbeat
 * Fired by the dashboard layout on every page load. Fills the device
 * details (IP, user-agent) of the current session row — the Auth.js jwt
 * callback has no request access — and detects NEW devices on first
 * contact, alerting the agency when staff log in from one.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const sid: string = typeof user.sid === 'string' ? user.sid : '';

    if (!sid) {
      // Sesión anterior (sin sid): no hay fila que tocar.
      return apiSuccess({ tracked: false }, 200);
    }

    const userAgent = request.headers.get('user-agent');
    const result = await touchSessionRecord({
      sessionId: sid,
      ipAddress: getClientIp(request),
      userAgent,
      userRole: user.role,
      userEmail: user.email,
      userFullName: user.name || user.fullName || null,
    });
    return apiSuccess({ tracked: true, isNewDevice: result.isNewDevice }, 200);
  } catch (error) {
    return handleApiError(error, 'sessions-heartbeat');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
