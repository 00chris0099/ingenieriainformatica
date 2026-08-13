import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { revokeSessionRecord } from '@/lib/sessions';

interface Props { params: Promise<{ id: string }> }

/**
 * POST /api/v1/sessions/[id]/revoke
 * Revokes a session row owned by the current user. The target browser is
 * expelled on its next request (session callback → sessionRevoked → 401
 * en APIs y redirect a /login en páginas). The CURRENT session cannot be
 * revoked here (use revoke-all or sign out).
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiError('id is not a valid UUID', 400);
    }

    const currentId = typeof user.sid === 'string' ? user.sid : null;
    if (currentId && id === currentId) {
      return apiError('No puedes revocar el dispositivo actual desde aquí — usa «Cerrar otras sesiones» o cierra sesión', 400);
    }

    const result = await revokeSessionRecord(id, user.id);
    if (result === 'forbidden') return apiError('No puedes revocar una sesión que no te pertenece', 403);
    if (result === 'not-found') return apiError('Sesión no encontrada', 404);
    return apiSuccess({ revoked: true }, 200);
  } catch (error) {
    return handleApiError(error, 'sessions-revoke');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
