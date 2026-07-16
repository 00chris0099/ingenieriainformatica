import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status === 'published') where.isPublished = true;
    if (status === 'draft') where.isPublished = false;

    const result = await prisma.blogPost.findMany({
      where,
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.blogPost.count({ where });

    return apiPaginated(result, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'blog-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, coverImage, tags, category, metaTitle, metaDescription, isPublished } = body;

    if (!title || !content) return apiError('title and content are required', 400);

    let slug = slugify(title);
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 160) + '...',
        coverImage: coverImage || null,
        tags: tags || [],
        category: category || null,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || content.substring(0, 160),
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    await invalidateCache('blog:*');

    return apiSuccess(post, 201);
  } catch (error) {
    return handleApiError(error, 'blog-create');
  }
}
