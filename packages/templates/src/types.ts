import { Block, ThemeConfig, SEOConfig } from '@repo/blocks'

export interface PageTemplate {
  id: string
  name: string
  description: string
  industry: string
  thumbnail?: string
  category: 'landing' | 'page' | 'store' | 'blog'
  blocks: Block[]
  theme: ThemeConfig
  seo: Partial<SEOConfig>
  settings: Record<string, any>
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  templates: PageTemplate[]
}
