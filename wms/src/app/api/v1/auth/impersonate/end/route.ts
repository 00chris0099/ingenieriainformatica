import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import {
  encodeRestoreToken,
  resolveSessionCookieName,
  sessionCookieAttributes,
  logImpersonationAudit,
  isImpersonatingSession,
  expireStaleImpersonations,
  findActiveImpersonation,
  closeImpersonationRecords,
  RESTORE_MAX_AGE,
} from '@/lib/impersonation';
import { notifyImpersonationEvent } from '@/lib/notifications/impersonation';

/**
 * POST /api/v1/auth/impersonate/end
 * Closes the temporary impersonation session and restores the real admin
 * session. Works in two cases:
 *  - the current session IS impersonating (normal banner flow), or
 *  - the admin has a server-side active record but a different browser/
 *    device (no impersonating session here) — closes the record remotely.
 * The route is public-prefixed for the middleware but self-guarded here.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const user = authCheck.user as any;
    await expireStaleImpersonations();

    // Caso A: esta sesión está impersonando → restaurar el token del admin real.
    if (isImpersonatingSession({ user })) {
      const adminId: string = user.impersonatedBy;
      if (!adminId) return apiError('Missing impersonation origin', 400);

      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin || !admin.isActive) {
        return apiError('Original account is no longer active — sign in again', 409);
      }

      const { name, secure } = resolveSessionCookieName(request);
      const token = await encodeRestoreToken(admin, name);
      const spec = { name, value: token, secure };
      const response = apiSuccess({ impersonating: false, restoredTo: admin.email }, 200);
      response.cookies.set(spec.name, spec.value, sessionCookieAttributes(spec, RESTORE_MAX_AGE));

      await closeImpersonationRecords(admin.id);

      await logImpersonationAudit({
        action: 'impersonate_end',
        targetId: user.id,
        targetEmail: user.email || '',
        adminId: admin.id,
        adminEmail: admin.email,
        ipAddress: getClientIp(request),
      });

      void notifyImpersonationEvent({
        action: 'impersonate_end',
        admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
        target: { id: user.id, email: user.email || '', fullName: user.name || null },
        ipAddress: getClientIp(request),
      });

      return response;
    }

    // Caso B: sin sesión impersonada aquí, pero hay un registro activo del
    // admin (otra pestaña/dispositivo) → cerrarlo remotamente.
    const active = await findActiveImpersonation(user.id);
    if (!active) {
      return apiError('No hay ninguna impersonación activa para terminar', 400);
    }

    await closeImpersonationRecords(user.id);

    await logImpersonationAudit({
      action: 'impersonate_end',
      targetId: active.targetId,
      targetEmail: active.targetEmail,
      adminId: user.id,
      adminEmail: user.email || '',
      ipAddress: getClientIp(request),
      extra: { closedRemotely: true },
    });

    void notifyImpersonationEvent({
      action: 'impersonate_end',
      admin: { id: user.id, email: user.email || '', fullName: user.name || null, role: user.role },
      target: { id: active.targetId, email: active.targetEmail, fullName: null },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ impersonating: false, closedRemotely: true, targetEmail: active.targetEmail }, 200);
  } catch (error) {
    return handleApiError(error, 'impersonate-end');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
