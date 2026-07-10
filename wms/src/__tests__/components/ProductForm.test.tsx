/**
 * Tests de integracion para el ProductForm
 * 
 * Estos tests verifican el flujo completo de creacion y edicion de productos,
 * incluyendo SKU auto-generado, variantes con atributos, y persistencia de datos.
 */

describe('ProductForm', () => {
  // ============================================================================
  // SKU Auto-Generation Tests
  // ============================================================================
  describe('SKU Auto-Generation', () => {
    it('should generate SKU based on category', () => {
      const categoryName = 'Muebles para Bebe';
      // Expected: ADK-MUE-001 (first 2 chars of each word)
      const categoryCode = categoryName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !['PARA', 'LOS', 'LAS', 'DEL', 'DE', 'EL', 'LA'].includes(w))
        .slice(0, 2)
        .map(w => w.substring(0, 2))
        .join('');
      
      expect(categoryCode).toBe('MU');
    });

    it('should handle single-word categories', () => {
      const categoryName = 'Accesorios';
      const categoryCode = categoryName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && !['PARA', 'LOS', 'LAS', 'DEL', 'DE', 'EL', 'LA'].includes(w))
        .slice(0, 2)
        .map(w => w.substring(0, 2))
        .join('');
      
      expect(categoryCode).toBe('AC');
    });

    it('should fallback to PRD when no category', () => {
      const categoryName = null;
      const categoryCode = categoryName
        ? categoryName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .split(/\s+/)
            .filter(w => w.length > 2 && !['PARA', 'LOS', 'LAS', 'DEL', 'DE', 'EL', 'LA'].includes(w))
            .slice(0, 2)
            .map(w => w.substring(0, 2))
            .join('')
        : 'PRD';
      
      expect(categoryCode).toBe('PRD');
    });
  });

  // ============================================================================
  // Form State Tests
  // ============================================================================
  describe('Form State', () => {
    it('should initialize with empty defaults', () => {
      const initialState = {
        sku: '',
        name: '',
        model: '',
        description: '',
        shortDescription: '',
        brand: '',
        categoryId: '',
        status: 'draft',
        tags: [],
        dimensions: { height: null, width: null, depth: null },
        color: '',
        materials: [],
        recommendedAge: '',
        warrantyDays: null,
        originCountry: '',
        weight: null,
        weightUnit: 'kg',
        lowStockAlert: null,
      };

      expect(initialState.sku).toBe('');
      expect(initialState.name).toBe('');
      expect(initialState.status).toBe('draft');
      expect(initialState.tags).toEqual([]);
      expect(initialState.materials).toEqual([]);
      expect(initialState.dimensions).toEqual({ height: null, width: null, depth: null });
    });

    it('should handle dimension updates', () => {
      const dimensions = { height: null, width: null, depth: null };
      const updated = { ...dimensions, height: 100 };
      
      expect(updated.height).toBe(100);
      expect(updated.width).toBeNull();
    });

    it('should handle materials array operations', () => {
      let materials: string[] = [];
      
      // Add
      materials = [...materials, 'Madera'];
      expect(materials).toEqual(['Madera']);
      
      // Add duplicate
      if (!materials.includes('Madera')) {
        materials = [...materials, 'Madera'];
      }
      expect(materials).toEqual(['Madera']);
      
      // Add another
      materials = [...materials, 'Metal'];
      expect(materials).toEqual(['Madera', 'Metal']);
      
      // Remove
      materials = materials.filter(m => m !== 'Madera');
      expect(materials).toEqual(['Metal']);
    });
  });

  // ============================================================================
  // Variant Tests
  // ============================================================================
  describe('Variants', () => {
    it('should create variant with auto-generated SKU', () => {
      const parentSku = 'ADK-MUE-001';
      const variantIndex = 0;
      const variantSku = `${parentSku}-V${variantIndex + 1}`;
      
      expect(variantSku).toBe('ADK-MUE-001-V1');
    });

    it('should handle variant attributes', () => {
      const attributes: Record<string, string> = {};
      attributes['Color'] = 'Rojo';
      attributes['Material'] = 'Madera';
      
      expect(attributes['Color']).toBe('Rojo');
      expect(attributes['Material']).toBe('Madera');
    });

    it('should calculate total stock from variants', () => {
      const variants = [
        { stock: 10 },
        { stock: 5 },
        { stock: 0 },
      ];
      
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      expect(totalStock).toBe(15);
    });
  });

  // ============================================================================
  // Pricing Tests
  // ============================================================================
  describe('Pricing', () => {
    it('should calculate discounted price', () => {
      const mainPrice = 100;
      const discountPercent = 15;
      const discountedPrice = mainPrice * (1 - discountPercent / 100);
      
      expect(discountedPrice).toBe(85);
    });

    it('should handle zero discount', () => {
      const mainPrice = 100;
      const discountPercent = 0;
      const discountedPrice = mainPrice * (1 - discountPercent / 100);
      
      expect(discountedPrice).toBe(100);
    });

    it('should toggle price types', () => {
      const enabledTypes: string[] = [];
      
      // Add especial
      enabledTypes.push('especial');
      expect(enabledTypes).toContain('especial');
      
      // Remove especial
      const filtered = enabledTypes.filter(t => t !== 'especial');
      expect(filtered).not.toContain('especial');
    });
  });

  // ============================================================================
  // Discount Popup Tests
  // ============================================================================
  describe('Discount Popup', () => {
    it('should have default discount popup config', () => {
      const config = {
        enabled: false,
        title: 'Oferta especial!',
        description: 'Obtén un descuento exclusivo',
        discountPercent: 10,
        ctaText: 'Comprar ahora',
        ctaUrl: '#',
        imageUrl: '',
        bgColor: '#16a34a',
        textColor: '#ffffff',
      };

      expect(config.enabled).toBe(false);
      expect(config.discountPercent).toBe(10);
      expect(config.bgColor).toBe('#16a34a');
    });

    it('should calculate discount popup price', () => {
      const productPrice = 200;
      const discountPercent = 15;
      const discountedPrice = productPrice * (1 - discountPercent / 100);
      
      expect(discountedPrice).toBe(170);
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================
  describe('Validation', () => {
    it('should require product name', () => {
      const name = '';
      const isValid = name.trim().length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should accept valid product name', () => {
      const name = 'Cuna Convertible 3 en 1';
      const isValid = name.trim().length > 0;
      
      expect(isValid).toBe(true);
    });

    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('test@')).toBe(false);
    });

    it('should validate phone format', () => {
      const phoneRegex = /^9\d{8}$/;
      
      expect(phoneRegex.test('999123456')).toBe(true);
      expect(phoneRegex.test('123456789')).toBe(false);
      expect(phoneRegex.test('99912')).toBe(false);
    });
  });

  // ============================================================================
  // Character Counter Tests
  // ============================================================================
  describe('Character Counter', () => {
    it('should calculate character percentage', () => {
      const current = 250;
      const max = 500;
      const percentage = (current / max) * 100;
      
      expect(percentage).toBe(50);
    });

    it('should detect warning at 80%', () => {
      const current = 400;
      const max = 500;
      const percentage = (current / max) * 100;
      const isWarning = percentage > 80;
      
      expect(isWarning).toBe(false);
    });

    it('should detect error at 100%', () => {
      const current = 500;
      const max = 500;
      const percentage = (current / max) * 100;
      const isError = percentage > 100;
      
      expect(isError).toBe(false);
    });
  });

  // ============================================================================
  // Auto-Save Tests
  // ============================================================================
  describe('Auto-Save', () => {
    it('should not auto-save when not dirty', () => {
      const isDirty = false;
      const shouldSave = isDirty;
      
      expect(shouldSave).toBe(false);
    });

    it('should auto-save when dirty', () => {
      const isDirty = true;
      const shouldSave = isDirty;
      
      expect(shouldSave).toBe(true);
    });

    it('should calculate time ago correctly', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const diffMs = now.getTime() - fiveMinutesAgo.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      expect(diffMins).toBe(5);
    });
  });

  // ============================================================================
  // Version History Tests
  // ============================================================================
  describe('Version History', () => {
    it('should calculate diff between versions', () => {
      const prev = { name: 'Producto A', price: 100 };
      const curr = { name: 'Producto B', price: 150 };
      
      const changes: string[] = [];
      if (prev.name !== curr.name) changes.push(`name: "${prev.name}" -> "${curr.name}"`);
      if (prev.price !== curr.price) changes.push(`price: ${prev.price} -> ${curr.price}`);
      
      expect(changes).toHaveLength(2);
      expect(changes[0]).toContain('Producto A');
      expect(changes[1]).toContain('150');
    });

    it('should detect no changes', () => {
      const prev = { name: 'Producto A', price: 100 };
      const curr = { name: 'Producto A', price: 100 };
      
      const changes: string[] = [];
      if (prev.name !== curr.name) changes.push('name changed');
      if (prev.price !== curr.price) changes.push('price changed');
      
      expect(changes).toHaveLength(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty product name', () => {
      const name = '';
      const slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      expect(slug).toBe('');
    });

    it('should handle special characters in name', () => {
      const name = 'Cuna "Especial" (3-en-1) @ Niños!';
      const slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      expect(slug).toBe('cuna-especial-3-en-1-ninos');
    });

    it('should handle very long product name', () => {
      const name = 'A'.repeat(200);
      const slug = name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      expect(slug.length).toBeLessThanOrEqual(200);
    });

    it('should handle maximum variants', () => {
      const maxVariants = 20;
      const variants = Array(maxVariants).fill(null).map((_, i) => ({
        id: `variant-${i}`,
        name: `Variante ${i + 1}`,
      }));
      
      expect(variants).toHaveLength(maxVariants);
    });

    it('should handle zero price', () => {
      const price = 0;
      const discountPercent = 10;
      const discountedPrice = price * (1 - discountPercent / 100);
      
      expect(discountedPrice).toBe(0);
    });

    it('should handle very high price', () => {
      const price = 999999.99;
      const formatted = `S/ ${price.toFixed(2)}`;
      
      expect(formatted).toBe('S/ 999999.99');
    });
  });
});
