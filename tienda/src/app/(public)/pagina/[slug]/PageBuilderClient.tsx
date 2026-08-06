'use client'

import UniversalPageRenderer from '@/components/page-builder/UniversalPageRenderer'
import { Block, ThemeConfig } from '@repo/blocks'

interface PageData {
  id: string
  title: string
  slug: string
  description?: string
  blocks: Block[]
  seo: Record<string, any>
  settings: Record<string, any>
}

export default function PageBuilderClient({ page }: { page: PageData }) {
  const theme: ThemeConfig | undefined = page.settings?.theme || undefined

  return (
    <UniversalPageRenderer
      blocks={page.blocks as Block[]}
      theme={theme}
      seo={page.seo as any}
    />
  )
}
