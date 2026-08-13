import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import { closeAllImpersonations, logImpersonationAudit } from '@/lib/impersonation';
import { notifyImpersonationBulkClose } from '@/lib/notifications/impersonation';

/**
 * POST /api/v1/auth/impersonate/sessions/close-all
 * Kill-switch: Super Admin closes EVERY active impersonation session at once.
 * Audited with a summary entry; each remote impersonator is revoked on its
 * next request by the session callback (no active record = no impersonation).
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const roleCheck = await requireRole('super_admin', 'admin');
    if (roleCheck.error) return roleCheck.error;

    const closer = authCheck.user as any;

    const actives = await prisma.impersonationSession.findMany({
      where: { status: 'active', expiresAt: { gt: new Date() } },
      select: { id: true, targetId: true, targetEmail: true, adminId: true, adminEmail: true },
    });
    if (actives.length === 0) {
      return apiError('No hay impersonaciones activas para cerrar', 400);
    }
    const first = actives[0];
    if (!first) return apiError('No hay impersonaciones activas para cerrar', 400);

    const count = await closeAllImpersonations();

    await logImpersonationAudit({
      action: 'impersonate_end',
      targetId: first.targetId,
      targetEmail: first.targetEmail,
      adminId: closer.id,
      adminEmail: closer.email || '',
      ipAddress: getClientIp(request),
      extra: {
        bulkClose: true,
        closedCount: count,
        targetEmails: actives.map((a) => a.targetEmail),
        adminEmails: actives.map((a) => a.adminEmail),
      },
    });

    void notifyImpersonationBulkClose({
      count,
      closedBy: closer.email || closer.name || 'super admin',
      adminEmails: Array.from(new Set(actives.map((a) => a.adminEmail))),
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ closedAll: true, count, targetEmails: actives.map((a) => a.targetEmail) }, 200);
  } catch (error) {
    return handleApiError(error, 'impersonate-sessions-close-all');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
