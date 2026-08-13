// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { csvEscape, toCsv } from '@/lib/csv';

describe('csvEscape', () => {
  it('escapa comas, comillas y saltos de línea', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('dijo "hola"')).toBe('"dijo ""hola"""');
    expect(csvEscape('a\nb')).toBe('"a\nb"');
  });
  it('deja sin comillas los valores simples', () => {
    expect(csvEscape('simple')).toBe('simple');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(0)).toBe('0');
  });
});

describe('toCsv', () => {
  it('construye un CSV con cabecera y filas', () => {
    const csv = toCsv([
      ['Fecha', 'Acción', 'Detalle'],
      ['10/08/2026', 'impersonate', 'Cliente: x@y.com'],
      ['11/08/2026', 'update', 'a,b'],
    ]);
    expect(csv).toBe('Fecha,Acción,Detalle\n10/08/2026,impersonate,Cliente: x@y.com\n11/08/2026,update,"a,b"');
  });
});
