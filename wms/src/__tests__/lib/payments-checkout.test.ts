import { describe, it, expect } from 'vitest';
import {
  parsePrice,
  currencySymbol,
  extractPageProducts,
  pageProductMap,
  generateOrderNumber,
  resolvePaymentConfig,
  buildWhatsappOrderUrl,
  maskToken,
  sanitizeBusinessSettings,
} from '@/lib/payments/checkout';

describe('payments/checkout helpers', () => {
  it('parsePrice tolera etiquetas de precio y números', () => {
    expect(parsePrice('S/ 59.90')).toBe(59.9);
    expect(parsePrice('$1,299.00')).toBe(1299);
    expect(parsePrice(42)).toBe(42);
    expect(parsePrice('')).toBe(0);
  });

  it('currencySymbol mapea monedas y por defecto usa S/', () => {
    expect(currencySymbol('PEN')).toBe('S/');
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol(undefined)).toBe('S/');
    expect(currencySymbol('')).toBe('S/');
  });

  it('extractPageProducts extrae productos solo de bloques product-grid', () => {
    const page = {
      blocks: [
        { type: 'hero', content: { products: [{ id: 'x' }] } },
        { type: 'product-grid', content: { products: [{ id: 'p1', price: 'S/ 10' }, { id: 'p2' }] } },
        { type: 'product-grid', content: { products: [{ id: 'p3' }] } },
      ],
    };
    const products = extractPageProducts(page);
    expect(products.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    const map = pageProductMap(page);
    expect(map.get('p1')?.price).toBe('S/ 10');
    expect(map.has('nope')).toBe(false);
  });

  it('generateOrderNumber genera ORD-YYYYMMDD-XXXX', () => {
    const n = generateOrderNumber();
    expect(n).toMatch(/^ORD-\d{8}-\d{4}$/);
    const p = generateOrderNumber('FAK');
    expect(p).toMatch(/^FAK-\d{8}-\d{4}$/);
  });

  it('resolvePaymentConfig usa token del negocio, luego env global, y detecta whatsapp', () => {
    const business = {
      settings: {
        payments: {
          mercadopago: { enabled: true, accessToken: 'TEST-123' },
          whatsapp: { enabled: true },
        },
        whatsappNumber: '51999999999',
        currency: 'USD',
      },
    };
    const cfg = resolvePaymentConfig(business, {});
    expect(cfg.mpEnabled).toBe(true);
    expect(cfg.mpToken).toBe('TEST-123');
    expect(cfg.whatsappEnabled).toBe(true);
    expect(cfg.whatsappNumber).toBe('51999999999');
    expect(cfg.currency).toBe('USD');

    const noMp = resolvePaymentConfig({ settings: { payments: {} } }, {});
    expect(noMp.mpEnabled).toBe(false);
    expect(noMp.mpToken).toBeNull();
    expect(noMp.whatsappEnabled).toBe(false);
  });

  it('maskToken nunca expone el token completo', () => {
    expect(maskToken('APP_USR-1234567890abcdef')).toContain('••••••••');
    expect(maskToken('APP_USR-1234567890abcdef')).not.toContain('1234567890abcdef');
    expect(maskToken('APP_USR-1234567890abcdef')?.endsWith('cdef')).toBe(true);
    expect(maskToken('')).toBeUndefined();
    expect(maskToken(null)).toBeUndefined();
  });

  it('sanitizeBusinessSettings quita el token crudo y deja el enmascarado', () => {
    const clean = sanitizeBusinessSettings({
      payments: {
        mercadopago: { enabled: true, accessToken: 'APP_USR-SECRET123' },
        whatsapp: { enabled: true },
      },
      currency: 'PEN',
    });
    expect(clean.payments.mercadopago.accessToken).toBeUndefined();
    expect(clean.payments.mercadopago.accessTokenMasked).toContain('••••');
    expect(clean.payments.mercadopago.enabled).toBe(true);
    expect(clean.currency).toBe('PEN');
    expect(sanitizeBusinessSettings(null)).toEqual({});
  });

  it('buildWhatsappOrderUrl incluye el número de pedido y el total', () => {
    const order = {
      orderNumber: 'ORD-20260810-1234',
      currency: 'PEN',
      total: 69.9,
      items: [{ productName: 'Camiseta', quantity: 2 }],
    };
    const url = buildWhatsappOrderUrl('51999999999', order);
    expect(url.startsWith('https://wa.me/51999999999?text=')).toBe(true);
    const msg = decodeURIComponent(url.split('?text=')[1] || '');
    expect(msg).toContain('ORD-20260810-1234');
    expect(msg).toContain('S/ 69.90');
  });
});
