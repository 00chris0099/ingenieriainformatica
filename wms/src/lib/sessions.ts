// ============================================================
// Device session registry (enterprise account security).
//
// Every sign-in creates a Session row whose id travels inside the
// JWT (`sid`). The session callback checks the row on every request:
// a revoked/removed row means the session is dead (like GitHub's
// "active sessions"). IP/device details are filled by a heartbeat
// from the dashboard (the Auth.js jwt callback has no request
// access), where "new device" is also detected and alerted.
// ============================================================

import { prisma } from '@repo/prisma';
import { sendEmail } from '@/lib/notifications/email';

/** Parse a User-Agent into a readable label, e.g. "Chrome 126 · Windows 11". */
export function computeDeviceLabel(ua?: string | null): string {
  if (!ua) return 'Navegador desconocido';
  const s = ua;
  let browser = 'Navegador';
  let os = 'Desconocido';

  if (/Edg\//.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(s)) browser = 'Opera';
  else if (/Firefox\//.test(s)) browser = 'Firefox';
  else if (/Chrome\/|CriOS\//.test(s)) browser = 'Chrome';
  else if (/Safari\//.test(s)) browser = 'Safari';
  else if (/MSIE|Trident/.test(s)) browser = 'Internet Explorer';

  if (/Windows NT 10/.test(s)) os = 'Windows 10/11';
  else if (/Windows NT 6\.1/.test(s)) os = 'Windows 7';
  else if (/Mac OS X/.test(s)) os = 'macOS';
  else if (/Android/.test(s)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(s)) os = 'iOS';
  else if (/Linux/.test(s)) os = 'Linux';

  const mobile = /Mobile/.test(s) ? ' (móvil)' : '';
  return `${browser} · ${os}${mobile}`;
}

/** Device fingerprint used to decide "is this a new device?". */
export function sameDevice(ipA?: string | null, uaA?: string | null, ipB?: string | null, uaB?: string | null): boolean {
  const norm = (v?: string | null) => (v || '').trim().toLowerCase();
  // Browser fingerprint first (same browser profile = same device), IP as backup.
  if (norm(uaA) && norm(uaA) === norm(uaB)) return true;
  return !!norm(ipA) && norm(ipA) === norm(ipB);
}

/** Create the session row at sign-in. Returns the session id (the JWT `sid`). */
export async function createSessionRecord(params: { userId: string; email: string }): Promise<string | null> {
  try {
    const rec = await prisma.session.create({
      data: { userId: params.userId, userEmail: params.email },
    });
    return rec.id;
  } catch (e) {
    console.error('[sessions] create failed:', (e as Error)?.message?.slice(0, 150));
    return null;
  }
}

/**
 * Fill device details and detect a NEW device (first contact from this
 * fingerprint, compared against the user's other sessions). Fires the
 * login alert when it's a new device and the user is agency staff.
 */
export async function touchSessionRecord(params: {
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userRole?: string;
  userEmail?: string;
  userFullName?: string | null;
}): Promise<{ isNewDevice: boolean }> {
  try {
    const session = await prisma.session.findUnique({ where: { id: params.sessionId } });
    if (!session) return { isNewDevice: false };

    const ip = params.ipAddress || null;
    const ua = params.userAgent || null;
    const alreadyHasDevice = !!session.deviceLabel;

    // Primera vez con datos del dispositivo → detectar si es nuevo.
    let isNewDevice = false;
    if (!alreadyHasDevice && (ip || ua)) {
      const others = await prisma.session.findMany({
        where: { userId: session.userId, revokedAt: null, id: { not: session.id } },
        select: { ipAddress: true, userAgent: true },
        take: 20,
      });
      isNewDevice = !others.some((o) => sameDevice(o.ipAddress, o.userAgent, ip, ua));
    }

    await prisma.session.update({
      where: { id: session.id },
      data: {
        ...(alreadyHasDevice ? {} : { ipAddress: ip, userAgent: ua, deviceLabel: computeDeviceLabel(ua) }),
        lastActiveAt: new Date(),
        ...(isNewDevice ? { isNewDevice: true } : {}),
      },
    });

    if (isNewDevice && ['super_admin', 'admin'].includes(params.userRole || '')) {
      void notifyNewDeviceLogin({
        user: { email: params.userEmail || session.userEmail, fullName: params.userFullName || null },
        ipAddress: ip,
        deviceLabel: computeDeviceLabel(ua),
      });
    }
    return { isNewDevice };
  } catch (e) {
    console.error('[sessions] touch failed:', (e as Error)?.message?.slice(0, 150));
    return { isNewDevice: false };
  }
}

/** True when the sid row exists and is not revoked (fail-safe: true on DB error). */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  // El middleware de Next corre en Edge, donde Prisma no está disponible:
  // ahí la sesión se considera activa (la revocación real la aplican las
  // APIs y las páginas, que corren en Node).
  if (process.env.NEXT_RUNTIME === 'edge') return true;
  try {
    const rec = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { revokedAt: true },
    });
    if (!rec) return false;
    return rec.revokedAt === null;
  } catch (e) {
    console.error('[sessions] active check failed:', (e as Error)?.message?.slice(0, 150));
    return true;
  }
}

export interface SessionRow {
  id: string;
  deviceLabel: string | null;
  ipAddress: string | null;
  isNewDevice: boolean;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

/** Active sessions of a user, newest first, marking the current one. */
export async function listUserSessions(userId: string, currentId?: string | null): Promise<SessionRow[]> {
  const rows = await prisma.session.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastActiveAt: 'desc' },
    take: 50,
  });
  return rows.map((r) => ({
    id: r.id,
    deviceLabel: r.deviceLabel || computeDeviceLabel(r.userAgent) || 'Dispositivo',
    ipAddress: r.ipAddress,
    isNewDevice: r.isNewDevice,
    createdAt: r.createdAt,
    lastActiveAt: r.lastActiveAt,
    isCurrent: !!currentId && r.id === currentId,
  }));
}

/** Revoke one of the user's sessions. Returns false if not found/owned/current. */
export async function revokeSessionRecord(sessionId: string, userId: string): Promise<'ok' | 'not-found' | 'forbidden' | 'current'> {
  const rec = await prisma.session.findUnique({ where: { id: sessionId } }).catch(() => null);
  if (!rec) return 'not-found';
  if (rec.userId !== userId) return 'forbidden';
  if (rec.revokedAt) return 'ok'; // ya estaba revocada
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  return 'ok';
}

/** Revoke every active session except the current one. Returns count. */
export async function revokeAllSessionsExcept(userId: string, exceptId?: string | null): Promise<number> {
  const res = await prisma.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { revokedAt: new Date() },
  });
  return res.count;
}

/** Password policy for self-service changes: ≥8, mayúscula y número. */
export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula';
  if (!/[0-9]/.test(password)) return 'La contraseña debe incluir al menos un número';
  return null;
}

/** Alerta de login desde dispositivo nuevo (staff): in-app a super admins + email al usuario y al staff. */
export async function notifyNewDeviceLogin(params: {
  user: { email: string; fullName?: string | null };
  ipAddress?: string | null;
  deviceLabel?: string | null;
}): Promise<void> {
  const title = '🛡️ Inicio de sesión desde un dispositivo nuevo';
  const body = [
    title,
    `👤 Usuario: ${params.user.fullName || params.user.email} (${params.user.email})`,
    params.deviceLabel ? `💻 Dispositivo: ${params.deviceLabel}` : '',
    params.ipAddress ? `🌐 IP: ${params.ipAddress}` : '',
    `🕒 ${new Date().toLocaleString('es-PE')}`,
    'Si no fuiste tú, cambia la contraseña y revoca la sesión desde Configuración → Seguridad.',
  ]
    .filter(Boolean)
    .join('\n');

  // 1) In-app a todos los super admins/admins (incluido el propio usuario si es staff).
  try {
    const staff = await prisma.user.findMany({
      where: { isActive: true, role: { in: ['super_admin', 'admin'] } },
      select: { id: true, email: true },
    });
    for (const s of staff) {
      await prisma.notificationQueue.create({
        data: {
          recipientId: s.id,
          recipientEmail: s.email,
          subject: title,
          body,
          channel: 'in-app',
          type: 'security',
        },
      });
    }
  } catch (e) {
    console.error('[sessions] alert queue:', (e as Error)?.message?.slice(0, 150));
  }

  // 2) Email al usuario afectado y a los super admins.
  try {
    const staffEmails = await prisma.user
      .findMany({
        where: { isActive: true, role: { in: ['super_admin', 'admin'] } },
        select: { email: true },
      })
      .then((rows) => rows.map((r) => r.email).filter(Boolean) as string[]);
    const to = Array.from(new Set([params.user.email, ...staffEmails]));
    if (to.length > 0) {
      await sendEmail({
        to,
        subject: title,
        html: `
          <!DOCTYPE html><html><head><meta charset="utf-8"></head>
          <body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px">
            <div style="background:#b91c1c;color:white;padding:20px;text-align:center;border-radius:10px 10px 0 0">
              <h1 style="margin:0;font-size:20px">🛡️ Nuevo dispositivo detectado</h1>
            </div>
            <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 10px 10px">
              <p style="font-size:14px;color:#374151;line-height:1.7">
                Se inició sesión en la cuenta <strong>${params.user.email}</strong> desde un dispositivo que no se había visto antes.
              </p>
              <table style="width:100%;font-size:14px;line-height:1.8;margin-top:12px">
                ${params.deviceLabel ? `<tr><td style="color:#6b7280;width:110px">Dispositivo</td><td style="font-weight:600">${params.deviceLabel}</td></tr>` : ''}
                ${params.ipAddress ? `<tr><td style="color:#6b7280;width:110px">IP</td><td style="font-weight:600">${params.ipAddress}</td></tr>` : ''}
                <tr><td style="color:#6b7280;width:110px">Fecha</td><td style="font-weight:600">${new Date().toLocaleString('es-PE')}</td></tr>
              </table>
              <p style="font-size:12px;color:#9ca3af;margin-top:16px">Si no fuiste tú, cambia la contraseña y revoca la sesión en Configuración → Seguridad.</p>
            </div>
          </body></html>
        `,
      });
    }
  } catch (e) {
    console.error('[sessions] alert email:', (e as Error)?.message?.slice(0, 150));
  }
}
