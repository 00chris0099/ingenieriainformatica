import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError, getClientIp } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { validatePasswordPolicy, revokeAllSessionsExcept } from '@/lib/sessions';

/**
 * POST /api/v1/account/password  { currentPassword, newPassword }
 * Self-service password change with policy (≥8, mayúscula, número) and
 * current-password verification. As a security best practice, every other
 * active session of the user is revoked (the current one survives).
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const body = await request.json().catch(() => ({}));
    const currentPassword: string = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword: string = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword) return apiError('Debes indicar tu contraseña actual', 400);

    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) return apiError(policyError, 400);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true, email: true, fullName: true } });
    if (!dbUser) return apiError('Usuario no encontrado', 404);

    const valid = await compare(currentPassword, dbUser.passwordHash);
    if (!valid) return apiError('La contraseña actual es incorrecta', 400);

    const newHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Buena práctica: expulsar los demás dispositivos.
    const currentId = typeof user.sid === 'string' ? user.sid : null;
    const revoked = await revokeAllSessionsExcept(user.id, currentId);

    try {
      await prisma.auditTrail.create({
        data: {
          tableName: 'user',
          recordId: user.id,
          action: 'update',
          performedBy: user.id,
          performedByType: 'user',
          ipAddress: getClientIp(request),
          newValues: { passwordChanged: true, otherSessionsRevoked: revoked },
        },
      });
    } catch (e) {
      console.error('[account-password] audit:', (e as Error)?.message?.slice(0, 150));
    }

    return apiSuccess({ changed: true, otherSessionsRevoked: revoked }, 200);
  } catch (error) {
    return handleApiError(error, 'account-password');
  }
}

/** GET is not supported here. */
export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
