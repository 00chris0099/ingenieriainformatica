import { prisma } from '@repo/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PageBuilderClient from './PageBuilderClient'

interface Props {
  params: { slug: string }
}

async function getPage(slug: string) {
  const page = await prisma.page.findFirst({
    where: { slug, status: 'published' },
  })
  if (!page) return null
  return {
    ...page,
    blocks: Array.isArray(page.blocks) ? page.blocks : [],
    seo: typeof page.seo === 'object' && page.seo !== null ? page.seo : {},
    settings: typeof page.settings === 'object' && page.settings !== null ? page.settings : {},
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage(params.slug)
  if (!page) return { title: 'Pagina no encontrada' }

  const seo = page.seo as Record<string, any>
  const title = seo.metaTitle || page.title
  const description = seo.metaDescription || page.description || ''

  return {
    title,
    description,
    robots: seo.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      title,
      description,
      type: 'website',
      ...(seo.ogImage && { images: [{ url: seo.ogImage }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(seo.ogImage && { images: [seo.ogImage] }),
    },
    ...(seo.canonicalUrl && { alternates: { canonical: seo.canonicalUrl } }),
  }
}

export default async function PageBuilderRoute({ params }: Props) {
  const page = await getPage(params.slug)
  if (!page) notFound()

  return <PageBuilderClient page={page as any} />
}
