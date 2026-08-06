import { BlockConfig } from './types'

class BlockRegistry {
  private blocks = new Map<string, BlockConfig>()

  register(config: BlockConfig): void {
    this.blocks.set(config.id, config)
  }

  registerMany(configs: BlockConfig[]): void {
    for (const config of configs) {
      this.blocks.set(config.id, config)
    }
  }

  get(id: string): BlockConfig | undefined {
    return this.blocks.get(id)
  }

  getAll(): BlockConfig[] {
    return Array.from(this.blocks.values())
  }

  getByCategory(category: BlockConfig['category']): BlockConfig[] {
    return this.getAll().filter(b => b.category === category)
  }

  getByIndustry(industry: string): BlockConfig[] {
    const industryBlocks: Record<string, string[]> = {
      ecommerce: ['hero', 'product-grid', 'features', 'testimonials', 'cta', 'pricing', 'faq', 'footer', 'newsletter', 'social-proof', 'countdown', 'gallery'],
      restaurant: ['hero', 'gallery', 'features', 'testimonials', 'contact', 'faq', 'countdown', 'footer', 'newsletter'],
      clinic: ['hero', 'features', 'testimonials', 'contact', 'faq', 'footer', 'newsletter'],
      gym: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'countdown', 'footer', 'newsletter'],
      portfolio: ['hero', 'features', 'gallery', 'testimonials', 'contact', 'footer'],
      saas: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'accordion', 'footer', 'newsletter'],
      education: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'footer', 'newsletter'],
      services: ['hero', 'features', 'testimonials', 'contact', 'cta', 'faq', 'footer', 'newsletter'],
    }
    const allowed = industryBlocks[industry]
    if (!allowed) return this.getAll()
    return this.getAll().filter(b => allowed.includes(b.id))
  }

  getCategories(): Array<{ id: string; name: string; blocks: BlockConfig[] }> {
    const categories = [
      { id: 'layout', name: 'Layout' },
      { id: 'content', name: 'Content' },
      { id: 'commerce', name: 'Commerce' },
      { id: 'social', name: 'Social' },
      { id: 'seo', name: 'SEO' },
    ]
    return categories.map(c => ({
      ...c,
      blocks: this.getByCategory(c.id as BlockConfig['category']),
    }))
  }

  getDefaultsForIndustry(industry: string): string[] {
    const defaults: Record<string, string[]> = {
      ecommerce: ['hero', 'product-grid', 'testimonials', 'cta', 'footer'],
      restaurant: ['hero', 'gallery', 'testimonials', 'contact', 'footer'],
      clinic: ['hero', 'features', 'testimonials', 'contact', 'footer'],
      gym: ['hero', 'features', 'pricing', 'testimonials', 'footer'],
      portfolio: ['hero', 'features', 'gallery', 'contact', 'footer'],
      saas: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'footer'],
      education: ['hero', 'features', 'pricing', 'testimonials', 'footer'],
      services: ['hero', 'features', 'testimonials', 'contact', 'footer'],
    }
    return defaults[industry] || ['hero', 'features', 'testimonials', 'cta', 'footer']
  }
}

export const blockRegistry = new BlockRegistry()
