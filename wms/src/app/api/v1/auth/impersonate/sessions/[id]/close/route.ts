import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import { closeImpersonationSession, logImpersonationAudit } from '@/lib/impersonation';
import { notifyImpersonationEvent } from '@/lib/notifications/impersonation';

interface Props { params: Promise<{ id: string }> }

/**
 * POST /api/v1/auth/impersonate/sessions/[id]/close
 * Super Admin closes an active impersonation session (any admin's) from
 * the dashboard panel. The remote session is revoked on its next request
 * via the session callback (no active record = no impersonation).
 */
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const roleCheck = await requireRole('super_admin', 'admin');
    if (roleCheck.error) return roleCheck.error;

    const closer = authCheck.user as any;
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return apiError('id is not a valid UUID', 400);
    }

    const existing = await prisma.impersonationSession.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, fullName: true, email: true, role: true } },
        target: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
    if (!existing) return apiError('Impersonation session not found', 404);
    if (existing.status !== 'active' || existing.expiresAt <= new Date()) {
      return apiError('La sesión ya está cerrada o vencida', 400);
    }

    const closed = await closeImpersonationSession(id);
    if (!closed) return apiError('Impersonation session not found', 404);

    await logImpersonationAudit({
      action: 'impersonate_end',
      targetId: existing.targetId,
      targetEmail: existing.targetEmail,
      adminId: closer.id,
      adminEmail: closer.email || '',
      ipAddress: getClientIp(request),
      extra: { closedBy: closer.email, closedRemotely: true, impersonatorEmail: existing.adminEmail },
    });

    void notifyImpersonationEvent({
      action: 'impersonate_end',
      admin: { id: existing.admin.id, email: existing.admin.email, fullName: existing.admin.fullName, role: existing.admin.role },
      target: { id: existing.target.id, email: existing.target.email, fullName: existing.target.fullName, role: existing.target.role },
      ipAddress: existing.ipAddress || undefined,
      closedBy: closer.email || closer.name || 'super admin',
    });

    return apiSuccess({ closed: true, id, targetEmail: existing.targetEmail }, 200);
  } catch (error) {
    return handleApiError(error, 'impersonate-session-close');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
