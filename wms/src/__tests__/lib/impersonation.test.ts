// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { decode } from 'next-auth/jwt';
import {
  IMPERSONATION_MAX_AGE,
  SESSION_COOKIE,
  SECURE_SESSION_COOKIE,
  findSessionCookieName,
  resolveSecureFlag,
  resolveSessionCookieName,
  encodeImpersonationToken,
  encodeRestoreToken,
  isImpersonatingSession,
} from '@/lib/impersonation';

const ADMIN = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@agencia.pe', fullName: 'Admin', role: 'super_admin', isActive: true };
const CLIENT = { id: '22222222-2222-4222-8222-222222222222', email: 'cliente@tienda.pe', fullName: 'Cliente Uno', role: 'client', isActive: true };

function fakeRequest(cookies: { name: string; value?: string }[], protocol = 'http:') {
  return {
    cookies: { getAll: () => cookies, get: (n: string) => cookies.find((c) => c.name === n) },
    nextUrl: { protocol },
  };
}

describe('findSessionCookieName', () => {
  it('detecta la cookie segura __Secure- cuando existe', () => {
    expect(findSessionCookieName([{ name: SECURE_SESSION_COOKIE }])).toBe(SECURE_SESSION_COOKIE);
  });
  it('detecta la cookie normal', () => {
    expect(findSessionCookieName([{ name: SESSION_COOKIE }])).toBe(SESSION_COOKIE);
  });
  it('prioriza la cookie existente del usuario', () => {
    expect(findSessionCookieName([{ name: 'otra', value: '1' }, { name: SESSION_COOKIE }])).toBe(SESSION_COOKIE);
  });
  it('devuelve null si no hay cookie de sesión', () => {
    expect(findSessionCookieName([{ name: 'csrf', value: 'x' }])).toBeNull();
  });
});

describe('resolveSecureFlag', () => {
  it('cookie __Secure- => secure', () => {
    expect(resolveSecureFlag(fakeRequest([]), SECURE_SESSION_COOKIE)).toBe(true);
  });
  it('cookie normal => no secure', () => {
    expect(resolveSecureFlag(fakeRequest([]), SESSION_COOKIE)).toBe(false);
  });
  it('fallback por protocolo https', () => {
    expect(resolveSecureFlag(fakeRequest([], 'https:'), null)).toBe(true);
    expect(resolveSecureFlag(fakeRequest([], 'http:'), null)).toBe(false);
  });
});

describe('resolveSessionCookieName', () => {
  it('reutiliza la cookie existente con su flag secure', () => {
    const r = resolveSessionCookieName(fakeRequest([{ name: SECURE_SESSION_COOKIE, value: 'old' }]));
    expect(r.name).toBe(SECURE_SESSION_COOKIE);
    expect(r.secure).toBe(true);
    const r2 = resolveSessionCookieName(fakeRequest([{ name: SESSION_COOKIE, value: 'old' }]));
    expect(r2.name).toBe(SESSION_COOKIE);
    expect(r2.secure).toBe(false);
  });
  it('fallback normal en http', () => {
    const r = resolveSessionCookieName(fakeRequest([]));
    expect(r.name).toBe(SESSION_COOKIE);
    expect(r.secure).toBe(false);
  });
  it('fallback seguro en https', () => {
    const r = resolveSessionCookieName(fakeRequest([], 'https:'));
    expect(r.name).toBe(SECURE_SESSION_COOKIE);
    expect(r.secure).toBe(true);
  });
});

describe('JWT de impersonación', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-impersonation-1234567890';
  });

  it('el token de impersonación es temporal (exp ≤ maxAge) y lleva el marcador', async () => {
    const { token, expiresAt } = await encodeImpersonationToken(CLIENT, ADMIN, SESSION_COOKIE);
    const payload: any = await decode({ token, secret: process.env.NEXTAUTH_SECRET!, salt: SESSION_COOKIE });
    expect(payload.id).toBe(CLIENT.id);
    expect(payload.role).toBe('client');
    expect(payload.impersonating).toBe(true);
    expect(payload.impersonatedBy).toBe(ADMIN.id);
    expect(payload.impersonatedByEmail).toBe(ADMIN.email);
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(IMPERSONATION_MAX_AGE + 5);
    expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('el token restaurado no tiene marcador de impersonación', async () => {
    const token = await encodeRestoreToken(ADMIN, SESSION_COOKIE);
    const payload: any = await decode({ token, secret: process.env.NEXTAUTH_SECRET!, salt: SESSION_COOKIE });
    expect(payload.id).toBe(ADMIN.id);
    expect(payload.role).toBe('super_admin');
    expect(payload.impersonating).toBeFalsy();
  });

  it('el salt seguro (__Secure-) produce un token distinto que el normal', async () => {
    const t1 = await encodeImpersonationToken(CLIENT, ADMIN, SESSION_COOKIE);
    const t2 = await encodeImpersonationToken(CLIENT, ADMIN, SECURE_SESSION_COOKIE);
    expect(t1.token).not.toBe(t2.token);
    const payload: any = await decode({ token: t2.token, secret: process.env.NEXTAUTH_SECRET!, salt: SECURE_SESSION_COOKIE });
    expect(payload.impersonating).toBe(true);
  });

  it('el modo solo lectura fuerza role readonly y marca el modo en el token', async () => {
    const { token } = await encodeImpersonationToken(CLIENT, ADMIN, SESSION_COOKIE, 'readonly');
    const payload: any = await decode({ token, secret: process.env.NEXTAUTH_SECRET!, salt: SESSION_COOKIE });
    expect(payload.role).toBe('readonly');
    expect(payload.impersonationMode).toBe('readonly');
    expect(payload.impersonationRenewals).toBe(0);
  });

  it('el modo completo conserva el rol del cliente y registra las renovaciones', async () => {
    const { token } = await encodeImpersonationToken(CLIENT, ADMIN, SESSION_COOKIE, 'full', 2);
    const payload: any = await decode({ token, secret: process.env.NEXTAUTH_SECRET!, salt: SESSION_COOKIE });
    expect(payload.role).toBe('client');
    expect(payload.impersonationMode).toBe('full');
    expect(payload.impersonationRenewals).toBe(2);
  });

  it('isImpersonatingSession distingue sesiones impersonadas', () => {
    expect(isImpersonatingSession({ user: { id: 'x', impersonating: true } })).toBe(true);
    expect(isImpersonatingSession({ user: { id: 'x' } })).toBe(false);
    expect(isImpersonatingSession(null)).toBe(false);
  });
});
