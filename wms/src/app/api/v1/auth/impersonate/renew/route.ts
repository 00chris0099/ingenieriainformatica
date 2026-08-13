import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import {
  encodeImpersonationToken,
  resolveSessionCookieName,
  sessionCookieAttributes,
  logImpersonationAudit,
  isImpersonatingSession,
  expireStaleImpersonations,
  findActiveImpersonation,
  extendImpersonationRecord,
  IMPERSONATION_MAX_RENEWALS,
} from '@/lib/impersonation';
import { notifyImpersonationEvent } from '@/lib/notifications/impersonation';

/**
 * POST /api/v1/auth/impersonate/renew
 * Extends an ACTIVE impersonation session by IMPERSONATION_MAX_AGE (1h):
 *  - re-signs the session JWT with a fresh `impersonatedUntil`,
 *  - extends the server-side ImpersonationSession record (source of truth),
 *  - audits the renewal and notifies the other agency staff.
 * Self-guarded: only works when the current session IS impersonating and the
 * server-side record is still active (revoked/expired sessions → 409).
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const user = authCheck.user as any;
    if (!isImpersonatingSession({ user })) {
      return apiError('No hay ninguna sesión de soporte activa para renovar', 400);
    }

    const adminId: string = user.impersonatedBy;
    if (!adminId) return apiError('Falta el origen de la impersonación', 400);

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isActive) {
      return apiError('La cuenta original ya no está activa — inicia sesión de nuevo', 409);
    }

    await expireStaleImpersonations();
    const active = await findActiveImpersonation(admin.id);
    if (!active) {
      return apiError('La sesión de soporte ya no está activa (fue cerrada o expiró)', 409);
    }

    // Política enterprise: tope de renovaciones por sesión.
    if ((active.renewalCount || 0) >= IMPERSONATION_MAX_RENEWALS) {
      return apiError(
        `Alcanzaste el máximo de ${IMPERSONATION_MAX_RENEWALS} renovaciones para esta sesión de soporte. Ciérrala con «Volver a mi cuenta» e inicia una nueva.`,
        409
      );
    }

    // Target con datos frescos (el rol/nombre pueden haber cambiado).
    const target = await prisma.user.findUnique({ where: { id: user.id } });
    if (!target || !target.isActive) {
      return apiError('El cliente ya no está activo — termina la sesión de soporte', 409);
    }

    const mode: 'full' | 'readonly' = active.mode === 'readonly' ? 'readonly' : 'full';
    const { name, secure } = resolveSessionCookieName(request);
    const { token, expiresAt } = await encodeImpersonationToken(target, admin, name, mode, (active.renewalCount || 0) + 1);
    const spec = { name, value: token, secure };

    const newCount = await extendImpersonationRecord(admin.id, expiresAt);
    if (newCount === null) {
      return apiError('La sesión de soporte ya no está activa (fue cerrada o expiró)', 409);
    }

    const renewalsLeft = Math.max(0, IMPERSONATION_MAX_RENEWALS - newCount);
    const response = apiSuccess({ renewed: true, expiresAt, renewalsLeft, mode }, 200);
    response.cookies.set(spec.name, spec.value, sessionCookieAttributes(spec));

    await logImpersonationAudit({
      action: 'impersonate',
      targetId: target.id,
      targetEmail: target.email,
      adminId: admin.id,
      adminEmail: admin.email,
      ipAddress: getClientIp(request),
      extra: { renewed: true, expiresAt, renewalCount: newCount, renewalsLeft },
    });

    // Notifica al resto del staff de la agencia (el actor se excluye solo).
    void notifyImpersonationEvent({
      action: 'impersonate_renew',
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
      target: { id: target.id, email: target.email, fullName: target.fullName, role: target.role },
      ipAddress: getClientIp(request),
      expiresAt,
      reason: active.reason || undefined,
      mode,
    });

    return response;
  } catch (error) {
    return handleApiError(error, 'impersonate-renew');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
