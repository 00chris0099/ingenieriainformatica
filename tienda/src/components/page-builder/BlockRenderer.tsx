'use client'

import { Block, ThemeConfig } from '@repo/blocks'
import HeroBlock from './blocks/HeroBlock'
import FeaturesBlock from './blocks/FeaturesBlock'
import CtaBlock from './blocks/CtaBlock'
import TestimonialsBlock from './blocks/TestimonialsBlock'
import FaqBlock from './blocks/FaqBlock'
import PricingBlock from './blocks/PricingBlock'
import NewsletterBlock from './blocks/NewsletterBlock'
import TextBlock from './blocks/TextBlock'
import {
  ImageBlock as ImageBlk,
  GalleryBlock as GalleryBlk,
  ColumnsBlock as ColumnsBlk,
  ContactBlock as ContactBlk,
  FooterBlock as FooterBlk,
  ProductGridBlock as ProductGridBlk,
  CountdownBlock as CountdownBlk,
  SocialProofBlock as SocialProofBlk,
  AccordionBlock as AccordionBlk,
} from './blocks/MiscBlocks'
import React from 'react'

interface BlockRendererProps {
  block: Block
  theme?: ThemeConfig
}

const blockRenderers: Record<string, React.ComponentType<BlockRendererProps>> = {
  hero: HeroBlock,
  features: FeaturesBlock,
  cta: CtaBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  pricing: PricingBlock,
  newsletter: NewsletterBlock,
  text: TextBlock,
  image: ImageBlk,
  gallery: GalleryBlk,
  columns: ColumnsBlk,
  contact: ContactBlk,
  footer: FooterBlk,
  'product-grid': ProductGridBlk,
  countdown: CountdownBlk,
  'social-proof': SocialProofBlk,
  accordion: AccordionBlk,
}

function BlockErrorFallback({ blockType }: { blockType: string }) {
  return (
    <div className="py-8 px-6 text-center text-gray-400 text-sm">
      Error rendering block &quot;{blockType}&quot;
    </div>
  )
}

export default function BlockRenderer({ block, theme }: BlockRendererProps) {
  const Renderer = blockRenderers[block.type]

  if (!Renderer) {
    return (
      <div className="py-8 px-6 text-center text-gray-400 text-sm">
        Block type &quot;{block.type}&quot; not rendered
      </div>
    )
  }

  try {
    return <Renderer block={block} theme={theme} />
  } catch {
    return <BlockErrorFallback blockType={block.type} />
  }
}
