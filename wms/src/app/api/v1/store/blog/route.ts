import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Público (sin auth): lista los artículos PUBLICADOS de una tienda.
 * `?business=<slug|id>` — si se omite, usa el subdominio del tenant (x-tenant-subdomain).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessParam = searchParams.get('business') || '';

    let business = null;
    if (businessParam) {
      // Solo matchear por id si el valor es un UUID válido (prisma lanza error si se pasa
      // un slug a una columna UUID dentro del OR)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessParam);
      const where: any = [{ slug: businessParam }];
      if (isUuid) where.push({ id: businessParam });
      business = await prisma.business.findFirst({
        where: { OR: where },
        select: { id: true, name: true, slug: true, logoUrl: true },
      });
    }

    if (!business) {
      const subdomain = request.headers.get('x-tenant-subdomain');
      if (subdomain) {
        business = await prisma.business.findUnique({
          where: { subdomain },
          select: { id: true, name: true, slug: true, logoUrl: true },
        });
      }
    }

    if (!business) return apiSuccess({ business: null, posts: [] });

    const posts = await prisma.blogPost.findMany({
      where: { businessId: business.id, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        tags: true,
        publishedAt: true,
        updatedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    return apiSuccess({ business, posts });
  } catch (error) {
    console.error('[STORE BLOG GET]', (error as Error)?.message?.slice(0, 200));
    return apiSuccess({ business: null, posts: [] });
  }
}
