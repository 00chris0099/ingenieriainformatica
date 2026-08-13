// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { impersonationSummary, impersonationEmailHtml } from '@/lib/notifications/impersonation';

const base = {
  action: 'impersonate' as const,
  admin: { id: '11111111-1111-4111-8111-111111111111', email: 'admin@agencia.pe', fullName: 'Admin Agencia', role: 'super_admin' },
  target: { id: '22222222-2222-4222-8222-222222222222', email: 'cliente@tienda.pe', fullName: 'Cliente Uno', role: 'client' },
  ipAddress: '200.1.2.3',
  expiresAt: '2026-08-11T05:55:19.220Z',
};

describe('impersonationSummary', () => {
  it('incluye quién, cliente, IP y expiración', () => {
    const s = impersonationSummary(base);
    expect(s).toContain('Impersonación iniciada');
    expect(s).toContain('Admin Agencia');
    expect(s).toContain('admin@agencia.pe');
    expect(s).toContain('cliente@tienda.pe');
    expect(s).toContain('200.1.2.3');
    expect(s).toContain('Expira');
  });

  it('distingue el evento de fin', () => {
    const s = impersonationSummary({ ...base, action: 'impersonate_end', expiresAt: undefined });
    expect(s).toContain('Impersonación finalizada');
    expect(s).not.toContain('Expira');
  });

  it('describe el evento de renovación con su expiración nueva', () => {
    const s = impersonationSummary({ ...base, action: 'impersonate_renew' });
    expect(s).toContain('Impersonación renovada');
    expect(s).toContain('Expira');
  });

  it('incluye motivo y modo solo lectura (compliance)', () => {
    const s = impersonationSummary({ ...base, reason: 'Soporte técnico — revisar catálogo', mode: 'readonly' });
    expect(s).toContain('📋 Motivo: Soporte técnico — revisar catálogo');
    expect(s).toContain('SOLO LECTURA');
  });

  it('no muestra motivo ni modo cuando no se proveen', () => {
    const s = impersonationSummary({ ...base, action: 'impersonate_end', expiresAt: undefined });
    expect(s).not.toContain('Motivo');
    expect(s).not.toContain('SOLO LECTURA');
  });
});

describe('impersonationEmailHtml', () => {
  it('genera HTML con quién, cliente e IP', () => {
    const html = impersonationEmailHtml(base);
    expect(html).toContain('Modo soporte activado');
    expect(html).toContain('admin@agencia.pe');
    expect(html).toContain('cliente@tienda.pe');
    expect(html).toContain('200.1.2.3');
    expect(html).toContain('#b45309'); // ámbar para inicio
  });

  it('usa azul para el evento de fin', () => {
    const html = impersonationEmailHtml({ ...base, action: 'impersonate_end' });
    expect(html).toContain('Sesión de soporte cerrada');
    expect(html).toContain('#1d4ed8');
  });

  it('usa verde y texto de renovación para impersonate_renew', () => {
    const html = impersonationEmailHtml({ ...base, action: 'impersonate_renew' });
    expect(html).toContain('Sesión de soporte renovada');
    expect(html).toContain('renovó su sesión temporal por 1 hora más');
    expect(html).toContain('#047857');
  });

  it('el email incluye motivo y modo solo lectura', () => {
    const html = impersonationEmailHtml({ ...base, reason: 'Soporte técnico', mode: 'readonly' });
    expect(html).toContain('Motivo');
    expect(html).toContain('Soporte técnico');
    expect(html).toContain('Solo lectura (ver sin tocar)');
  });
});
