import { blockRegistry } from './registry'
import { heroBlock } from './blocks/hero'
import { featuresBlock } from './blocks/features'
import { ctaBlock } from './blocks/cta'
import { testimonialsBlock } from './blocks/testimonials'
import { faqBlock } from './blocks/faq'
import { footerBlock } from './blocks/footer'
import { productGridBlock } from './blocks/product-grid'
import { pricingBlock } from './blocks/pricing'
import { newsletterBlock } from './blocks/newsletter'
import { textBlock } from './blocks/text'
import { imageBlock } from './blocks/image'
import { galleryBlock } from './blocks/gallery'
import { columnsBlock } from './blocks/columns'
import { countdownBlock } from './blocks/countdown'
import { contactBlock } from './blocks/contact'
import { socialProofBlock } from './blocks/social-proof'
import { accordionBlock } from './blocks/accordion'
import { navbarBlock } from './blocks/navbar'
import { teamBlock } from './blocks/team'

// Register all blocks
blockRegistry.registerMany([
  heroBlock,
  navbarBlock,
  featuresBlock,
  ctaBlock,
  testimonialsBlock,
  faqBlock,
  footerBlock,
  productGridBlock,
  pricingBlock,
  newsletterBlock,
  textBlock,
  imageBlock,
  galleryBlock,
  columnsBlock,
  countdownBlock,
  contactBlock,
  socialProofBlock,
  accordionBlock,
  teamBlock,
])

export { blockRegistry } from './registry'
export type { Block, BlockConfig, SettingsField, SEOConfig, ThemeConfig, PageData, BusinessConfig, BlockRenderProps, BlockEditorProps } from './types'

// Convenience exports
export function getAllBlocks() {
  return blockRegistry.getAll()
}

export function getBlockById(id: string) {
  return blockRegistry.get(id)
}

export function getBlocksByCategory(category: string) {
  return blockRegistry.getByCategory(category as any)
}

export function getBlocksForIndustry(industry: string) {
  return blockRegistry.getByIndustry(industry)
}

export function getDefaultBlocksForIndustry(industry: string) {
  return blockRegistry.getDefaultsForIndustry(industry)
}
