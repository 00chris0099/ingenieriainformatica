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

function extractSeo(page: any): Record<string, any> {
  return page?.seo && typeof page.seo === 'object' ? page.seo : {}
}

function extractSettings(page: any): Record<string, any> {
  return page?.settings && typeof page.settings === 'object' && !Array.isArray(page.settings)
    ? page.settings
    : {}
}

function extractProducts(page: any): any[] {
  const blocks: any[] = Array.isArray(page?.blocks) ? page.blocks : []
  return blocks
    .filter((b) => b?.type === 'product-grid' && Array.isArray(b?.content?.products))
    .flatMap((b) => b.content.products)
    .slice(0, 12)
}

function extractFaqs(page: any): Array<{ question: string; answer: string }> {
  const blocks: any[] = Array.isArray(page?.blocks) ? page.blocks : []
  return blocks
    .filter((b) => (b?.type === 'faq' || b?.type === 'accordion') && Array.isArray(b?.content?.items))
    .flatMap((b) => b.content.items)
    .filter((i: any) => i?.question && i?.answer)
    .slice(0, 12)
}

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WMS_URL || process.env.WMS_URL || 'https://aimachristian-tiendawms.ajcxjb.easypanel.host').replace(/\/+$/, '')
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getPublishedPage(id)
  const seo = extractSeo(page)

  const title = seo.title || page?.title || 'Tienda Virtual'
  const description = seo.description || page?.description || 'Página creada en la Plataforma de Tiendas Virtuales'
  const url = `${siteBaseUrl()}/p/${id}`
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.join(', ') : undefined

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: page?.title || 'Tienda Virtual',
      locale: 'es_PE',
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  }
}

export default async function PublicPageRenderer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getPublishedPage(id)

  if (!page) {
    notFound()
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : []
  const settings = extractSettings(page)
  const seo = extractSeo(page)
  const products = extractProducts(page)
  const faqs = extractFaqs(page)
  const baseUrl = siteBaseUrl()
  const pageUrl = `${baseUrl}/p/${id}`
  const businessName = seo.organizationName || page.title || 'Mi Tienda'
  const whatsapp = settings.whatsappNumber || '51999888777'

  // ─── JSON-LD structured data (SEO + GEO) ─────────────────────────────────
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: businessName,
    url: pageUrl,
    description: seo.description || page.description || '',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${whatsapp}`,
      contactType: 'customer service',
      areaServed: 'PE',
      availableLanguage: 'Spanish',
    },
    sameAs: seo.socialLinks && Array.isArray(seo.socialLinks) ? seo.socialLinks : undefined,
  }

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: businessName,
    url: pageUrl,
    description: seo.description || page.description || '',
    inLanguage: 'es-PE',
  }

  // Product JSON-LD — rich results for the catalog (crucial for e-commerce SEO)
  const productsLd = products.map((p: any) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description || seo.description || '',
    image: p.imageUrl || undefined,
    sku: p.sku || undefined,
    offers: {
      '@type': 'Offer',
      price: parseFloat(String(p.price || '').replace(/[^\d.,]/g, '').replace(',', '.')) || undefined,
      priceCurrency: 'PEN',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
    ...(p.discountBadge ? { aggregateRating: undefined } : {}),
  }))

  // FAQ JSON-LD — rich results + GEO answerable content
  const faqLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null

  return (
    <>
      {/* Enterprise typography (Sora display + Inter body) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap"
      />
      <link rel="canonical" href={pageUrl} />

      {/* JSON-LD: Organization (GEO: entity recognition) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      {/* JSON-LD: WebSite */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      {/* JSON-LD: Products (rich results) */}
      {productsLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productsLd) }} />
      )}
      {/* JSON-LD: FAQPage (rich results + GEO) */}
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <PublicStoreClient pageTitle={page.title} blocks={blocks} settings={settings} seo={seo} />
    </>
  )
}
