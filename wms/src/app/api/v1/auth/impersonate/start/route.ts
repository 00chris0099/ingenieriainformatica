import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import {
  encodeImpersonationToken,
  resolveSessionCookieName,
  sessionCookieAttributes,
  logImpersonationAudit,
  isImpersonatingSession,
  expireStaleImpersonations,
  findActiveImpersonation,
  createImpersonationRecord,
} from '@/lib/impersonation';
import { notifyImpersonationEvent } from '@/lib/notifications/impersonation';

/**
 * POST /api/v1/auth/impersonate/start  { userId }
 * Super Admin / Agency Admin opens a temporary audited session as a client.
 *
 * Blocked when the caller already has an impersonation session active:
 *  - same browser: the session itself is impersonating (409)
 *  - another browser/device: a server-side active record exists (409)
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const admin = authCheck.user as any;

    // 1) Misma sesión ya impersonando → no se puede iniciar otra.
    if (isImpersonatingSession({ user: admin })) {
      return apiError(
        `Ya tienes una sesión de soporte activa (estás viendo el portal como ${admin.email || 'un cliente'}). Termínala con «Volver a mi cuenta» antes de iniciar otra.`,
        409
      );
    }

    const roleCheck = await requireRole('super_admin', 'admin');
    if (roleCheck.error) return roleCheck.error;
    const body = await request.json().catch(() => ({}));
    const userId: string = typeof body.userId === 'string' ? body.userId.trim() : '';
    const reason: string = typeof body.reason === 'string' ? body.reason.trim() : '';
    const mode: 'full' | 'readonly' = body.mode === 'readonly' ? 'readonly' : 'full';

    if (!userId) return apiError('userId is required', 400);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return apiError('userId is not a valid UUID', 400);
    }
    // Compliance: toda impersonación requiere un motivo registrable.
    if (reason.length < 3) {
      return apiError('Debes indicar el motivo de la impersonación (p. ej. soporte, configuración, capacitación)', 400);
    }
    if (reason.length > 300) return apiError('El motivo es demasiado largo (máx. 300 caracteres)', 400);

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return apiError('User not found', 404);
    if (!target.isActive) return apiError('Cannot impersonate an inactive user', 400);
    if (target.id === admin.id) return apiError('Cannot impersonate yourself', 400);
    if (['super_admin', 'admin'].includes(target.role)) {
      return apiError('Cannot impersonate staff users (super_admin/admin)', 403);
    }

    // 2) Otra pestaña/dispositivo: registro server-side activo del mismo admin.
    await expireStaleImpersonations();
    const active = await findActiveImpersonation(admin.id);
    if (active) {
      return apiError(
        `Ya tienes una impersonación activa como ${active.targetEmail} (iniciada ${new Date(active.startedAt).toLocaleString('es-PE')}). Termínala con «Volver a mi cuenta» o espera a que expire.`,
        409
      );
    }

    const { name, secure } = resolveSessionCookieName(request);
    const { token, expiresAt } = await encodeImpersonationToken(target, admin, name, mode);
    const spec = { name, value: token, secure };
    const response = apiSuccess(
      {
        impersonating: true,
        mode,
        target: { id: target.id, email: target.email, fullName: target.fullName },
        expiresAt,
      },
      200
    );
    response.cookies.set(spec.name, spec.value, sessionCookieAttributes(spec));

    await createImpersonationRecord({
      adminId: admin.id,
      adminEmail: admin.email,
      targetId: target.id,
      targetEmail: target.email,
      ipAddress: getClientIp(request),
      expiresAt,
      reason,
      mode,
    });

    await logImpersonationAudit({
      action: 'impersonate',
      targetId: target.id,
      targetEmail: target.email,
      adminId: admin.id,
      adminEmail: admin.email,
      ipAddress: getClientIp(request),
      extra: { expiresAt, role: target.role, reason, mode },
    });

    // Notifica al super admin (fire-and-forget, nunca rompe el flujo)
    void notifyImpersonationEvent({
      action: 'impersonate',
      admin: { id: admin.id, email: admin.email, fullName: admin.name || admin.fullName, role: admin.role },
      target: { id: target.id, email: target.email, fullName: target.fullName, role: target.role },
      ipAddress: getClientIp(request),
      expiresAt,
      reason,
      mode,
    });

    return response;
  } catch (error) {
    return handleApiError(error, 'impersonate-start');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
