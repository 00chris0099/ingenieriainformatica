import { describe, it, expect } from 'vitest';
import { normalizeCartItems, cartSubtotal, cartCount, recoveryLink } from '@/lib/carts';

describe('normalizeCartItems', () => {
  it('filtra items inválidos y recorta cantidades/prices', () => {
    const items = normalizeCartItems([
      { id: 'p1', name: 'Producto 1', price: '59.90', qty: 2 },
      { id: 'p2', name: 'Producto 2', price: 100, qty: 999 },
      { id: '', name: 'Sin id' },
      null,
      { id: 'p3', name: '', price: 5 },
      { name: 'Sin id tampoco', price: 5 },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'p1', name: 'Producto 1', qty: 2 });
    expect(items[1]).toMatchObject({ id: 'p2', qty: 99 }); // qty cap 99
  });

  it('tolera precios con formato', () => {
    const [it] = normalizeCartItems([{ id: 'x', name: 'X', price: 'S/ 1,299.00', qty: 1 }]);
    expect(it!.price).toBe(1299);
  });

  it('limita a 50 items', () => {
    const many = Array.from({ length: 80 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, price: 1, qty: 1 }));
    expect(normalizeCartItems(many)).toHaveLength(50);
  });
});

describe('totales', () => {
  it('calcula subtotal y conteo', () => {
    const items = normalizeCartItems([
      { id: 'a', name: 'A', price: 10, qty: 2 },
      { id: 'b', name: 'B', price: 5.5, qty: 1 },
    ]);
    expect(cartSubtotal(items)).toBe(25.5);
    expect(cartCount(items)).toBe(3);
  });
});

describe('recoveryLink', () => {
  it('construye el enlace de recompra con el clientId', () => {
    const link = recoveryLink('mi-tienda', 'wms-123.4');
    expect(link).toContain('/p/mi-tienda?restore=wms-123.4');
  });

  it('maneja slugs vacíos', () => {
    expect(recoveryLink(undefined, 'abc')).toContain('/p/?restore=abc');
  });
});
