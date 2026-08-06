import { describe, it, expect, beforeEach } from 'vitest'
import { blockRegistry } from '@repo/blocks'
import type { BlockConfig } from '@repo/blocks/types'

describe('BlockRegistry', () => {
  describe('register & get', () => {
    it('should register and retrieve a block', () => {
      const testBlock: BlockConfig = {
        id: 'test-block',
        name: 'Test Block',
        description: 'A test block',
        category: 'content',
        icon: 'TestIcon',
        defaultSettings: {},
        defaultContent: { title: 'Hello' },
        settingsSchema: [],
      }

      blockRegistry.register(testBlock)
      const retrieved = blockRegistry.get('test-block')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('test-block')
      expect(retrieved?.name).toBe('Test Block')
    })

    it('should return undefined for non-existent block', () => {
      expect(blockRegistry.get('non-existent')).toBeUndefined()
    })
  })

  describe('registerMany', () => {
    it('should register multiple blocks at once', () => {
      const blocks: BlockConfig[] = [
        {
          id: 'multi-1',
          name: 'Multi 1',
          description: 'First',
          category: 'layout',
          icon: 'Icon1',
          defaultSettings: {},
          defaultContent: {},
          settingsSchema: [],
        },
        {
          id: 'multi-2',
          name: 'Multi 2',
          description: 'Second',
          category: 'commerce',
          icon: 'Icon2',
          defaultSettings: {},
          defaultContent: {},
          settingsSchema: [],
        },
      ]

      blockRegistry.registerMany(blocks)

      expect(blockRegistry.get('multi-1')).toBeDefined()
      expect(blockRegistry.get('multi-2')).toBeDefined()
    })
  })

  describe('getAll', () => {
    it('should return all registered blocks', () => {
      const all = blockRegistry.getAll()
      expect(all.length).toBeGreaterThanOrEqual(17)
    })
  })

  describe('getByCategory', () => {
    it('should filter blocks by category', () => {
      const layoutBlocks = blockRegistry.getByCategory('layout')
      expect(layoutBlocks.length).toBeGreaterThan(0)
      layoutBlocks.forEach(block => {
        expect(block.category).toBe('layout')
      })
    })

    it('should return empty array for category with no blocks', () => {
      const empty = blockRegistry.getByCategory('seo' as any)
      expect(Array.isArray(empty)).toBe(true)
    })
  })

  describe('getByIndustry', () => {
    it('should return blocks for ecommerce', () => {
      const blocks = blockRegistry.getByIndustry('ecommerce')
      expect(blocks.length).toBeGreaterThan(0)
      const ids = blocks.map(b => b.id)
      expect(ids).toContain('hero')
      expect(ids).toContain('product-grid')
      expect(ids).toContain('footer')
    })

    it('should return blocks for restaurant', () => {
      const blocks = blockRegistry.getByIndustry('restaurant')
      const ids = blocks.map(b => b.id)
      expect(ids).toContain('hero')
      expect(ids).toContain('gallery')
      expect(ids).toContain('contact')
    })

    it('should return all blocks for unknown industry', () => {
      const blocks = blockRegistry.getByIndustry('unknown')
      expect(blocks.length).toBe(blockRegistry.getAll().length)
    })
  })

  describe('getDefaultsForIndustry', () => {
    it('should return default blocks for ecommerce', () => {
      const defaults = blockRegistry.getDefaultsForIndustry('ecommerce')
      expect(defaults).toContain('hero')
      expect(defaults).toContain('product-grid')
      expect(defaults).toContain('footer')
    })

    it('should return generic defaults for unknown industry', () => {
      const defaults = blockRegistry.getDefaultsForIndustry('unknown')
      expect(defaults).toContain('hero')
      expect(defaults).toContain('footer')
    })
  })

  describe('getCategories', () => {
    it('should return categories with blocks', () => {
      const categories = blockRegistry.getCategories()
      expect(categories.length).toBe(5)

      const layoutCat = categories.find(c => c.id === 'layout')
      expect(layoutCat).toBeDefined()
      expect(layoutCat!.blocks.length).toBeGreaterThan(0)
    })
  })

  describe('all registered blocks have valid config', () => {
    it('should have required fields on every block', () => {
      const all = blockRegistry.getAll()
      all.forEach(block => {
        expect(block.id).toBeTruthy()
        expect(block.name).toBeTruthy()
        expect(block.description).toBeTruthy()
        expect(block.category).toBeTruthy()
        expect(block.icon).toBeTruthy()
        expect(typeof block.defaultSettings).toBe('object')
        expect(typeof block.defaultContent).toBe('object')
        expect(Array.isArray(block.settingsSchema)).toBe(true)
      })
    })

    it('should have unique IDs', () => {
      const all = blockRegistry.getAll()
      const ids = all.map(b => b.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })
})
