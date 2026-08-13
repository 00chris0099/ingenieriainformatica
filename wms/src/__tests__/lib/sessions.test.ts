// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeDeviceLabel, sameDevice, validatePasswordPolicy } from '@/lib/sessions';

describe('computeDeviceLabel', () => {
  it('detecta Chrome en Windows', () => {
    expect(computeDeviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')).toBe('Chrome · Windows 10/11');
  });
  it('detecta Safari en macOS', () => {
    expect(computeDeviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15')).toBe('Safari · macOS');
  });
  it('detecta Android móvil', () => {
    expect(computeDeviceLabel('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36')).toBe('Chrome · Android (móvil)');
  });
  it('detecta Firefox en Windows 7', () => {
    expect(computeDeviceLabel('Mozilla/5.0 (Windows NT 6.1; rv:126.0) Gecko/20100101 Firefox/126.0')).toBe('Firefox · Windows 7');
  });
  it('devuelve desconocido sin user-agent', () => {
    expect(computeDeviceLabel(null)).toBe('Navegador desconocido');
  });
});

describe('sameDevice', () => {
  it('mismo user-agent ⇒ mismo dispositivo', () => {
    expect(sameDevice('1.2.3.4', 'Chrome/126', '9.9.9.9', 'Chrome/126')).toBe(true);
  });
  it('UA distinto pero misma IP ⇒ mismo dispositivo', () => {
    expect(sameDevice('1.2.3.4', 'Chrome/126', '1.2.3.4', 'Firefox/126')).toBe(true);
  });
  it('UA e IP distintas ⇒ dispositivo nuevo', () => {
    expect(sameDevice('1.2.3.4', 'Chrome/126', '5.6.7.8', 'Firefox/126')).toBe(false);
  });
  it('sin datos ⇒ no se puede afirmar que sea el mismo', () => {
    expect(sameDevice(null, null, '1.2.3.4', 'Chrome/126')).toBe(false);
    expect(sameDevice('1.2.3.4', null, null, null)).toBe(false);
  });
});

describe('validatePasswordPolicy', () => {
  it('rechaza contraseñas cortas', () => {
    expect(validatePasswordPolicy('Ab1')).toContain('8 caracteres');
    expect(validatePasswordPolicy('abcdefgh')).toContain('mayúscula');
    expect(validatePasswordPolicy('Abcdefgh')).toContain('número');
  });
  it('acepta una contraseña fuerte', () => {
    expect(validatePasswordPolicy('Segura123!')).toBeNull();
  });
});
