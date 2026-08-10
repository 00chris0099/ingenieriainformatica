import { cache } from 'react'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@repo/prisma'

export const revalidate = 60

/** Solo artículos PUBLICADOS. Resuelve por slug, prefiriendo el negocio del subdominio del tenant. */
const getPublishedPost = cache(async (slug: string): Promise<any | null> => {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') || h.get('host') || ''
    const rootDomain = (process.env.WMS_URL || 'aimachristian-tiendawms.ajcxjb.easypanel.host')
      .replace(/^https?:\/\//, '').split(':')[0]
    const cleanHost = host.split(':')[0]
    let tenantSubdomain: string | null = null
    if (cleanHost && rootDomain && cleanHost !== rootDomain && cleanHost.endsWith(`.${rootDomain}`)) {
      tenantSubdomain = cleanHost.replace(`.${rootDomain}`, '')
    }

    const base = {
      where: { slug, isPublished: true } as any,
      include: {
        business: { select: { id: true, name: true, slug: true, logoUrl: true, subdomain: true } },
        blogCategory: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, fullName: true, email: true } },
      },
    }

    // Preferir el negocio del subdominio actual, si existe
    if (tenantSubdomain) {
      const tenantBusiness = await prisma.business.findUnique({ where: { subdomain: tenantSubdomain }, select: { id: true } })
      if (tenantBusiness) {
        const tenantPost = await prisma.blogPost.findFirst({ ...base, where: { ...base.where, businessId: tenantBusiness.id } })
        if (tenantPost) return tenantPost
      }
    }

    return await prisma.blogPost.findFirst(base)
  } catch (e) {
    console.warn('[BLOG PAGE] DB error:', (e as any)?.message?.slice(0, 80))
    return null
  }
})

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WMS_URL || process.env.WMS_URL || 'https://aimachristian-tiendawms.ajcxjb.easypanel.host').replace(/\/+$/, '')
}

function readingTime(content: string): number {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) return { title: 'Artículo no encontrado' }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || `Artículo de ${post.business?.name || 'la tienda'}`
  const url = `${siteBaseUrl()}/blog/${post.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: post.business?.name || 'Blog',
      locale: 'es_PE',
      publishedTime: post.publishedAt?.toISOString?.() || post.updatedAt.toISOString(),
      authors: post.author?.fullName ? [post.author.fullName] : undefined,
      tags: post.tags || undefined,
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPost(slug)
  if (!post) notFound()

  // Contador de vistas (fire-and-forget, no bloquea el render)
  prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  const baseUrl = siteBaseUrl()
  const url = `${baseUrl}/blog/${post.slug}`
  const business = post.business
  const authorName = post.author?.fullName || business?.name || 'Equipo editorial'
  const categoryName = post.blogCategory?.name || post.category || null
  const minutes = readingTime(post.content)
  const publishedAt = post.publishedAt || post.updatedAt
  const homeUrl = business ? `${baseUrl}/p/${business.slug}` : baseUrl

  const paragraphs: string[] = String(post.content || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  // ─── JSON-LD: Article / BlogPosting (rich results + SEO) ────────────────
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    wordCount: String(post.content || '').trim().split(/\s+/).filter(Boolean).length,
    articleSection: categoryName || undefined,
    keywords: post.tags?.length ? post.tags.join(', ') : undefined,
    inLanguage: 'es-PE',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Person',
      name: authorName,
      ...(post.author?.email ? { email: post.author.email } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: business?.name || 'WMS Platform',
      ...(business?.logoUrl ? { logo: { '@type': 'ImageObject', url: business.logoUrl } } : {}),
    },
    ...(business ? { provider: { '@type': 'Organization', name: business.name, url: `${baseUrl}/p/${business.slug}` } } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: business?.name || 'Inicio', item: homeUrl },
      ...(categoryName ? [{ '@type': 'ListItem', position: 2, name: categoryName }] : []),
      { '@type': 'ListItem', position: categoryName ? 3 : 2, name: post.title, item: url },
    ],
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap"
      />
      <link rel="canonical" href={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <main className="min-h-screen bg-white text-slate-900 antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Barra superior: volver a la tienda */}
        <div className="border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href={homeUrl} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <span aria-hidden>←</span> {business?.name || 'Volver a la tienda'}
            </a>
            {business?.logoUrl && (
              <img src={business.logoUrl} alt={business.name || ''} className="h-8 w-auto max-w-[140px] object-contain" />
            )}
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          {/* Encabezado */}
          <header className="space-y-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              {categoryName && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {categoryName}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-500">
                {publishedAt.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })} · {minutes} min de lectura
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {post.title}
            </h1>
            {post.excerpt && <p className="text-base md:text-lg text-slate-500 leading-relaxed">{post.excerpt}</p>}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500">
                {authorName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <span className="text-xs font-bold text-slate-700">Por {authorName}</span>
            </div>
          </header>

          {/* Portada */}
          {post.coverImage && (
            <img src={post.coverImage} alt={post.title} className="w-full rounded-2xl border border-slate-200 object-cover aspect-video mb-8" />
          )}

          {/* Contenido */}
          <div className="space-y-5 text-[15px] leading-relaxed text-slate-800">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Etiquetas */}
          {post.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-8 mt-8 border-t border-slate-100">
              {post.tags.map((t: string) => (
                <span key={t} className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
    </>
  )
}
