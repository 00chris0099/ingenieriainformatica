// ============================================================
// Secure impersonation ("Entrar como") for the agency.
//
// The Super Admin / Agency Admin can open a *temporary, audited*
// session as a store client. The session is a short-lived JWT
// (IMPERSONATION_MAX_AGE) that carries the client identity plus
// the `impersonating` marker and who started it. While active,
// the middleware treats the session exactly like the client's own
// (role = client) so every multi-tenant guard applies — the
// impersonator can never reach agency-only pages/APIs. Start and
// end are both written to the AuditTrail.
// ============================================================

import { encode } from 'next-auth/jwt';
import { prisma } from '@repo/prisma';

/** How long an impersonation session lives (seconds). Default 1 hour, configurable via env. */
export const IMPERSONATION_MAX_AGE = Number(process.env.IMPERSONATION_MAX_AGE_SECONDS) || 60 * 60;

/** Max renewals per impersonation session (enterprise policy). Default 3. */
export const IMPERSONATION_MAX_RENEWALS = Number(process.env.IMPERSONATION_MAX_RENEWALS) || 3;

/** Default Auth.js session lifetime for the restored admin cookie (30 days). */
export const RESTORE_MAX_AGE = 30 * 24 * 60 * 60;

/** The cookie name Auth.js v5 uses for the JWT session token. */
export const SESSION_COOKIE = 'authjs.session-token';
export const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

interface CookieLike { name: string; value?: string }

/** Structural stand-in for NextRequest so the lib stays runtime-light (testable). */
export interface RequestLike {
  cookies: { getAll(): CookieLike[]; get(name: string): CookieLike | undefined };
  nextUrl?: { protocol: string };
}

/** @internal — exported for tests. */
export function findSessionCookieName(cookies: { name: string; value?: string }[]): string | null {
  const list = Array.isArray(cookies) ? cookies : [];
  const existing = list.find((c) => c.name === SESSION_COOKIE || c.name === SECURE_SESSION_COOKIE);
  if (existing) return existing.name;
  // Fallback: any Auth.js session token variant (e.g. custom cookie prefix).
  const anyToken = list.find((c) => c.name.endsWith('session-token'));
  return anyToken ? anyToken.name : null;
}

/** Decide whether cookies must be Secure, mirroring the live cookie when present. */
export function resolveSecureFlag(request: RequestLike, cookieName: string | null): boolean {
  if (cookieName === SECURE_SESSION_COOKIE) return true;
  if (cookieName === SESSION_COOKIE) return false;
  const envUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
  if (envUrl.startsWith('https://')) return true;
  return request.nextUrl?.protocol === 'https:';
}

/**
 * Resolve the session cookie name for this request. Mirrors the live cookie
 * when present; otherwise falls back to the secure/normal variant that
 * Auth.js itself would use (based on the request protocol / env URL).
 * The name doubles as the JWT `salt` Auth.js uses to sign/verify the token.
 */
export function resolveSessionCookieName(request: RequestLike): { name: string; secure: boolean } {
  const existing = findSessionCookieName(request.cookies.getAll());
  if (existing) return { name: existing, secure: existing === SECURE_SESSION_COOKIE };
  const secure = resolveSecureFlag(request, null);
  return { name: secure ? SECURE_SESSION_COOKIE : SESSION_COOKIE, secure };
}

interface ImpersonationUser {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
}

interface ImpersonationAdmin {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
}

function sessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured');
  return secret;
}

/**
 * Encode a JWT for the impersonated client session (1h, auditable).
 * `salt` must be the session cookie name so Auth.js can verify the token.
 * `mode`: 'full' (as the client) | 'readonly' (view-only — the middleware
 * blocks every mutation for the readonly role). `renewals`: how many times
 * this session has been renewed so far (for the renewal policy badge).
 */
export async function encodeImpersonationToken(
  target: ImpersonationUser,
  admin: ImpersonationAdmin,
  salt: string = SESSION_COOKIE,
  mode: 'full' | 'readonly' = 'full',
  renewals: number = 0
): Promise<{ token: string; expiresAt: string }> {
  const now = Date.now();
  const expiresAt = new Date(now + IMPERSONATION_MAX_AGE * 1000).toISOString();
  const token = await encode({
    secret: sessionSecret(),
    salt,
    maxAge: IMPERSONATION_MAX_AGE,
    token: {
      sub: target.id,
      id: target.id,
      email: target.email,
      name: target.fullName || undefined,
      picture: target.avatarUrl || undefined,
      role: mode === 'readonly' ? 'readonly' : target.role || 'client',
      isActive: target.isActive,
      impersonating: true,
      impersonatedBy: admin.id,
      impersonatedByEmail: admin.email,
      impersonatedUntil: expiresAt,
      impersonationMode: mode,
      impersonationRenewals: renewals,
      originalRole: admin.role,
    },
  });
  return { token, expiresAt };
}

/** Re-encode a normal (admin) session token to restore the real account. */
export async function encodeRestoreToken(admin: ImpersonationUser, salt: string = SESSION_COOKIE): Promise<string> {
  return encode({
    secret: sessionSecret(),
    salt,
    token: {
      sub: admin.id,
      id: admin.id,
      email: admin.email,
      name: admin.fullName || undefined,
      picture: admin.avatarUrl || undefined,
      role: admin.role || 'super_admin',
      isActive: admin.isActive,
    },
  });
}

/** Write an AuditTrail entry for impersonation start/end. */
export async function logImpersonationAudit(params: {
  action: 'impersonate' | 'impersonate_end';
  targetId: string;
  targetEmail: string;
  adminId: string;
  adminEmail: string;
  ipAddress?: string | null;
  extra?: Record<string, unknown>;
}) {
  try {
    await prisma.auditTrail.create({
      data: {
        tableName: 'user',
        recordId: params.targetId,
        action: params.action,
        performedBy: params.adminId,
        performedByType: 'user',
        ipAddress: params.ipAddress || null,
        newValues: {
          targetEmail: params.targetEmail,
          adminEmail: params.adminEmail,
          ...(params.extra || {}),
        },
      },
    });
  } catch (error) {
    // Audit must never break the impersonation flow itself.
    console.error('[impersonation] audit failed:', (error as Error)?.message?.slice(0, 200));
  }
}

export interface SessionCookieSpec {
  name: string;
  value: string;
  secure: boolean;
}

/** Shared cookie attributes for the session token. */
export function sessionCookieAttributes(spec: SessionCookieSpec, maxAge: number = IMPERSONATION_MAX_AGE) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: spec.secure,
    maxAge,
  };
}

/** True when the given Auth.js session belongs to an impersonation. */
export function isImpersonatingSession(session: any): boolean {
  return !!(session?.user && (session.user as any).impersonating);
}

// ═══════════════════ Active-session registry (server-side, per admin) ═══════════════════
// Impersonation state is tracked in `ImpersonationSession` so the same admin
// cannot hold two active impersonations (e.g. from different browsers/devices).
// Records self-expire: once `expiresAt` passes they never block again.

export interface ImpersonationRecord {
  id: string;
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetEmail: string;
  status: string;
  ipAddress: string | null;
  startedAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  reason: string | null;
  mode: string;
  renewalCount: number;
  lastRenewedAt: Date | null;
}

/** Mark any expired active records as ended (lazy cleanup). */
export async function expireStaleImpersonations(): Promise<void> {
  try {
    await prisma.impersonationSession.updateMany({
      where: { status: 'active', expiresAt: { lte: new Date() } },
      data: { status: 'ended', endedAt: new Date() },
    });
  } catch (e) {
    console.error('[impersonation] stale cleanup failed:', (e as Error)?.message?.slice(0, 150));
  }
}

/**
 * Find the current active (non-expired) impersonation for an admin, if any.
 * Expired records never block — they are lazily marked ended.
 */
export async function findActiveImpersonation(adminId: string): Promise<ImpersonationRecord | null> {
  try {
    return await prisma.impersonationSession.findFirst({
      where: { adminId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { startedAt: 'desc' },
    });
  } catch (e) {
    console.error('[impersonation] find active failed:', (e as Error)?.message?.slice(0, 150));
    return null;
  }
}

export async function createImpersonationRecord(params: {
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetEmail: string;
  ipAddress?: string | null;
  expiresAt: string;
  reason?: string | null;
  mode?: 'full' | 'readonly';
}): Promise<ImpersonationRecord> {
  return prisma.impersonationSession.create({
    data: {
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      targetId: params.targetId,
      targetEmail: params.targetEmail,
      ipAddress: params.ipAddress || null,
      expiresAt: new Date(params.expiresAt),
      reason: params.reason || null,
      mode: params.mode || 'full',
    },
  });
}

/**
 * Extend the expiry of an admin's active impersonation record (renew): updates
 * `expiresAt`, increments `renewalCount` and stamps `lastRenewedAt` atomically.
 * Returns the NEW renewal count, or null when nothing was updated
 * (already ended/expired).
 */
export async function extendImpersonationRecord(adminId: string, expiresAt: string): Promise<number | null> {
  try {
    const updated = await prisma.impersonationSession.updateMany({
      where: { adminId, status: 'active' },
      data: {
        expiresAt: new Date(expiresAt),
        renewalCount: { increment: 1 },
        lastRenewedAt: new Date(),
      },
    });
    if (updated.count === 0) return null;
    const rec = await prisma.impersonationSession.findFirst({
      where: { adminId, status: 'active' },
      select: { renewalCount: true },
    });
    return rec?.renewalCount ?? null;
  } catch (e) {
    // If the record can't be extended, the server-side expiry stays shorter than
    // the JWT — the session callback will revoke it then (fail-safe direction).
    console.error('[impersonation] extend failed:', (e as Error)?.message?.slice(0, 150));
    return null;
  }
}

/**
 * Close EVERY active impersonation session (emergency kill-switch, super-admin
 * only). Returns the number of sessions closed. Each remote impersonator is
 * revoked on its next request by the session callback (no active record).
 */
export async function closeAllImpersonations(): Promise<number> {
  const res = await prisma.impersonationSession.updateMany({
    where: { status: 'active' },
    data: { status: 'ended', endedAt: new Date() },
  });
  return res.count;
}

/** Close every active impersonation record owned by an admin. */
export async function closeImpersonationRecords(adminId: string): Promise<number> {
  const res = await prisma.impersonationSession.updateMany({
    where: { adminId, status: 'active' },
    data: { status: 'ended', endedAt: new Date() },
  });
  return res.count;
}

/** Close a single impersonation session by id (super-admin panel action). */
export async function closeImpersonationSession(id: string): Promise<ImpersonationRecord | null> {
  const existing = await prisma.impersonationSession.findUnique({ where: { id } });
  if (!existing) return null;
  if (existing.status !== 'active' || existing.expiresAt <= new Date()) return existing;
  return prisma.impersonationSession.update({
    where: { id },
    data: { status: 'ended', endedAt: new Date() },
  });
}

/**
 * True when an active (non-expired) impersonation record exists for this
 * admin+target pair. Used by the NextAuth session callback to REVOKE an
 * impersonation that was closed remotely (super-admin panel): if the record
 * is gone, the session stops impersonating and the admin identity returns.
 * Fail-safe: if the DB can't be reached, keep the impersonation as-is.
 */
export async function isImpersonationActive(adminId: string, targetId: string): Promise<boolean> {
  try {
    const rec = await prisma.impersonationSession.findFirst({
      where: { adminId, targetId, status: 'active', expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    return !!rec;
  } catch (e) {
    console.error('[impersonation] active check failed:', (e as Error)?.message?.slice(0, 150));
    return true;
  }
}
