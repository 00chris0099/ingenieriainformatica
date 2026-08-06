import { describe, it, expect } from 'vitest'
import { templateRegistry } from '@repo/templates'

describe('TemplateRegistry', () => {
  describe('getAll', () => {
    it('should return all 8 templates', () => {
      const all = templateRegistry.getAll()
      expect(all.length).toBe(8)
    })
  })

  describe('get', () => {
    it('should retrieve template by ID', () => {
      const template = templateRegistry.get('ecommerce-modern')
      expect(template).toBeDefined()
      expect(template?.name).toBeTruthy()
      expect(template?.industry).toBe('ecommerce')
    })

    it('should return undefined for non-existent template', () => {
      expect(templateRegistry.get('non-existent')).toBeUndefined()
    })
  })

  describe('getByIndustry', () => {
    it('should filter templates by industry', () => {
      const ecommerce = templateRegistry.getByIndustry('ecommerce')
      expect(ecommerce.length).toBeGreaterThan(0)
      ecommerce.forEach(t => {
        expect(t.industry).toBe('ecommerce')
      })
    })

    it('should return empty array for industry with no templates', () => {
      const empty = templateRegistry.getByIndustry('logistics')
      expect(empty.length).toBe(0)
    })
  })

  describe('getByCategory', () => {
    it('should filter templates by category', () => {
      const landings = templateRegistry.getByCategory('landing')
      expect(landings.length).toBeGreaterThan(0)
      landings.forEach(t => {
        expect(t.category).toBe('landing')
      })
    })
  })

  describe('search', () => {
    it('should find templates by name', () => {
      const results = templateRegistry.search('moderno')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(t => t.name.toLowerCase().includes('moderno'))).toBe(true)
    })

    it('should find templates by description', () => {
      const results = templateRegistry.search('restaurante')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should find templates by industry', () => {
      const results = templateRegistry.search('clinic')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should return empty for no matches', () => {
      const results = templateRegistry.search('xyznonexistent')
      expect(results.length).toBe(0)
    })
  })

  describe('getCategories', () => {
    it('should return categories', () => {
      const categories = templateRegistry.getCategories()
      expect(categories.length).toBeGreaterThan(0)
      categories.forEach(cat => {
        expect(cat.id).toBeTruthy()
        expect(cat.name).toBeTruthy()
        expect(Array.isArray(cat.templates)).toBe(true)
      })
    })
  })

  describe('template structure', () => {
    it('every template has required fields', () => {
      const all = templateRegistry.getAll()
      all.forEach(template => {
        expect(template.id).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.description).toBeTruthy()
        expect(template.industry).toBeTruthy()
        expect(template.category).toBeTruthy()
        expect(Array.isArray(template.blocks)).toBe(true)
        expect(template.blocks.length).toBeGreaterThan(0)
        expect(template.theme).toBeDefined()
        expect(template.theme.colors).toBeDefined()
        expect(template.theme.fonts).toBeDefined()
      })
    })

    it('every template has unique IDs', () => {
      const all = templateRegistry.getAll()
      const ids = all.map(t => t.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('every template has valid blocks with type and content', () => {
      const all = templateRegistry.getAll()
      all.forEach(template => {
        template.blocks.forEach(block => {
          expect(block.id).toBeTruthy()
          expect(block.type).toBeTruthy()
          expect(typeof block.content).toBe('object')
        })
      })
    })
  })
})
