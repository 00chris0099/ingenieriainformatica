import { templateRegistry } from './registry'

export { templateRegistry }
export type { PageTemplate, TemplateCategory } from './types'

// Convenience exports
export function getAllTemplates() {
  return templateRegistry.getAll()
}

export function getTemplateById(id: string) {
  return templateRegistry.get(id)
}

export function getTemplatesByIndustry(industry: string) {
  return templateRegistry.getByIndustry(industry)
}

export function getTemplateCategories() {
  return templateRegistry.getCategories()
}

export function searchTemplates(query: string) {
  return templateRegistry.search(query)
}
