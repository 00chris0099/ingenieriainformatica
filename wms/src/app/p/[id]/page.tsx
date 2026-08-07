import { notFound } from 'next/navigation'
import { pageStore } from '@/lib/pageStore'
import { prisma } from '@repo/prisma'
import { Block } from '@repo/blocks'
import PublicStoreClient from '@/components/public/PublicStoreClient'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = params
  let title = 'Tienda Virtual'
  let description = 'Pagina creada en WMS Platform'

  if (pageStore.has(id)) {
    const p = pageStore.get(id)
    title = p.title || title
    description = p.description || description
  } else {
    try {
      const p = await prisma.page.findFirst({
        where: { OR: [{ id }, { slug: id }] }
      })
      if (p) {
        title = p.title
        description = p.description || description
      }
    } catch {}
  }

  return { title, description }
}

export default async function PublicPageRenderer({ params }: { params: { id: string } }) {
  const { id } = params
  let page: any = null

  if (pageStore.has(id)) {
    page = pageStore.get(id)
  } else {
    try {
      page = await prisma.page.findFirst({
        where: { OR: [{ id }, { slug: id }] }
      })
    } catch {}
  }

  if (!page) {
    notFound()
  }

  const blocks: Block[] = Array.isArray(page.blocks) ? page.blocks : []

  return <PublicStoreClient pageTitle={page.title} blocks={blocks} />
}
