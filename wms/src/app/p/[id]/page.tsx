import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/prisma'
import { Block } from '@repo/blocks'
import PublicStoreClient from '@/components/public/PublicStoreClient'

/** Only published pages are ever served publicly. Drafts/synthetic pages → 404. */
const getPublishedPage = cache(async (idOrSlug: string): Promise<any | null> => {
  try {
    return await prisma.page.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: 'published',
      },
    })
  } catch (e) {
    console.warn('[PUBLIC PAGE] DB error:', (e as any)?.message?.slice(0, 80))
    return null
  }
})

export async function generateMetadata({ params }: { params: { id: string } }) {
  const page = await getPublishedPage(params.id)
  const seo = (page?.seo && typeof page.seo === 'object' ? page.seo : {}) as Record<string, any>

  return {
    title: seo.title || page?.title || 'Tienda Virtual',
    description: seo.description || page?.description || 'Página creada en la Plataforma de Tiendas Virtuales',
    robots: { index: true, follow: true },
    openGraph: {
      title: seo.title || page?.title || 'Tienda Virtual',
      description: seo.description || page?.description || '',
      type: 'website',
      siteName: page?.title || 'Tienda Virtual',
    },
  }
}

export default async function PublicPageRenderer({ params }: { params: { id: string } }) {
  const page = await getPublishedPage(params.id)

  if (!page) {
    notFound()
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : []
  const settings =
    page.settings && typeof page.settings === 'object' && !Array.isArray(page.settings)
      ? (page.settings as Record<string, any>)
      : {}
  const seo = (page.seo && typeof page.seo === 'object' ? page.seo : {}) as Record<string, any>

  return (
    <>
      {/* Enterprise typography (Sora display + Inter body) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap"
      />

      {/* JSON-LD: WebSite structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: page.title,
            description: page.description || '',
          }),
        }}
      />

      <PublicStoreClient pageTitle={page.title} blocks={blocks} settings={settings} seo={seo} />
    </>
  )
}
