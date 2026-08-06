import { PageTemplate, TemplateCategory } from './types'
import { ecommerceModern } from './templates/ecommerce'
import { restaurantElegant } from './templates/restaurant'
import { clinicClean } from './templates/clinic'
import { gymBold } from './templates/gym'
import { portfolioMinimal } from './templates/portfolio'
import { saasModern } from './templates/saas'
import { educationModern } from './templates/education'
import { servicesCorporate } from './templates/services'

const allTemplates: PageTemplate[] = [
  ecommerceModern,
  restaurantElegant,
  clinicClean,
  gymBold,
  portfolioMinimal,
  saasModern,
  educationModern,
  servicesCorporate,
]

class TemplateRegistry {
  private templates = new Map<string, PageTemplate>()

  constructor() {
    for (const template of allTemplates) {
      this.templates.set(template.id, template)
    }
  }

  get(id: string): PageTemplate | undefined {
    return this.templates.get(id)
  }

  getAll(): PageTemplate[] {
    return Array.from(this.templates.values())
  }

  getByIndustry(industry: string): PageTemplate[] {
    return this.getAll().filter(t => t.industry === industry)
  }

  getByCategory(category: PageTemplate['category']): PageTemplate[] {
    return this.getAll().filter(t => t.category === category)
  }

  getCategories(): TemplateCategory[] {
    const industries = Array.from(new Set(this.getAll().map(t => t.industry)))
    return industries.map(industry => ({
      id: industry,
      name: industry.charAt(0).toUpperCase() + industry.slice(1),
      description: `Templates para ${industry}`,
      templates: this.getByIndustry(industry),
    }))
  }

  search(query: string): PageTemplate[] {
    const q = query.toLowerCase()
    return this.getAll().filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.industry.toLowerCase().includes(q)
    )
  }
}

export const templateRegistry = new TemplateRegistry()
