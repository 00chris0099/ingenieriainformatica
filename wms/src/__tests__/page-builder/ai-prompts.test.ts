import { describe, it, expect } from 'vitest'
import { buildBlockContentPrompt, blockTypeDescriptions } from '../../../../packages/ai/src/prompts/block-content'
import { buildSEOPrompt } from '../../../../packages/ai/src/prompts/seo'
import type { GenerateBlockContentRequest, GenerateSEORequest } from '../../../../packages/ai/src/types'

describe('AI Prompts', () => {
  describe('buildBlockContentPrompt', () => {
    it('should generate a prompt for a hero block', () => {
      const request: GenerateBlockContentRequest = {
        blockType: 'hero',
        businessName: 'AdriSu Kids',
        businessDescription: 'Tienda de productos para bebés',
        industry: 'ecommerce',
        tone: 'professional',
        language: 'es',
      }

      const prompt = buildBlockContentPrompt(request)

      expect(prompt).toContain('hero')
      expect(prompt).toContain('AdriSu Kids')
      expect(prompt).toContain('Tienda de productos para bebés')
      expect(prompt).toContain('español')
      expect(prompt).toContain('profesional')
      expect(prompt).toContain('JSON')
    })

    it('should use default tone when not specified', () => {
      const request: GenerateBlockContentRequest = {
        blockType: 'features',
        businessName: 'Test',
      }

      const prompt = buildBlockContentPrompt(request)
      expect(prompt).toContain('formal y profesional')
    })

    it('should handle casual tone', () => {
      const request: GenerateBlockContentRequest = {
        blockType: 'cta',
        tone: 'casual',
      }

      const prompt = buildBlockContentPrompt(request)
      expect(prompt).toContain('casual y cercano')
    })

    it('should handle English language', () => {
      const request: GenerateBlockContentRequest = {
        blockType: 'newsletter',
        language: 'en',
      }

      const prompt = buildBlockContentPrompt(request)
      expect(prompt).toContain('inglés')
    })

    it('should include additional context when provided', () => {
      const request: GenerateBlockContentRequest = {
        blockType: 'testimonials',
        additionalContext: 'Enfoque en madres primerizas',
      }

      const prompt = buildBlockContentPrompt(request)
      expect(prompt).toContain('Enfoque en madres primerizas')
    })
  })

  describe('blockTypeDescriptions', () => {
    it('should have descriptions for all 17 block types', () => {
      const expectedTypes = [
        'hero', 'features', 'cta', 'testimonials', 'faq', 'footer',
        'product-grid', 'pricing', 'newsletter', 'text', 'image',
        'gallery', 'columns', 'countdown', 'contact', 'social-proof', 'accordion',
      ]

      expectedTypes.forEach(type => {
        expect(blockTypeDescriptions[type]).toBeTruthy()
        expect(typeof blockTypeDescriptions[type]).toBe('string')
      })
    })
  })

  describe('buildSEOPrompt', () => {
    it('should generate an SEO prompt with all context', () => {
      const request: GenerateSEORequest = {
        businessName: 'AdriSu Kids',
        businessDescription: 'Tienda de productos para bebés',
        industry: 'ecommerce',
        pageContent: 'Bienvenidos a AdriSu Kids, tu tienda de confianza.',
        targetKeywords: ['productos bebe', 'tienda bebe'],
      }

      const prompt = buildSEOPrompt(request)

      expect(prompt).toContain('AdriSu Kids')
      expect(prompt).toContain('ecommerce')
      expect(prompt).toContain('productos bebe')
      expect(prompt).toContain('tienda bebe')
      expect(prompt).toContain('meta título')
      expect(prompt).toContain('meta descripción')
      expect(prompt).toContain('JSON')
    })

    it('should handle request without target keywords', () => {
      const request: GenerateSEORequest = {
        businessName: 'Test Business',
        businessDescription: 'Some description',
        industry: 'services',
        pageContent: 'Page content here',
      }

      const prompt = buildSEOPrompt(request)
      expect(prompt).toContain('Genera palabras clave relevantes')
    })

    it('should truncate long page content', () => {
      const longContent = 'A'.repeat(2000)
      const request: GenerateSEORequest = {
        businessName: 'Test',
        businessDescription: 'Desc',
        industry: 'test',
        pageContent: longContent,
      }

      const prompt = buildSEOPrompt(request)
      expect(prompt.length).toBeLessThan(longContent.length + 500)
    })
  })
})
