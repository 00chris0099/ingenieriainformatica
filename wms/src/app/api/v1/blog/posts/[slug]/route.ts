import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { invalidateCache } from '@/lib/cache';

interface Props { params: { slug: string } }

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { OR: [{ id: params.slug }, { slug: params.slug }] },
      include: { author: { select: { id: true, fullName: true } } },
    });
    if (!post) return apiError('Post not found', 404);

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return apiSuccess(post);
  } catch (error) {
    return handleApiError(error, 'blog-get');
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const body = await request.json();
    const post = await prisma.blogPost.findFirst({
      where: { OR: [{ id: params.slug }, { slug: params.slug }] },
    });
    if (!post) return apiError('Post not found', 404);

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        ...body,
        publishedAt: body.isPublished && !post.publishedAt ? new Date() : post.publishedAt,
      },
    });

    await invalidateCache('blog:*');

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'blog-update');
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { OR: [{ id: params.slug }, { slug: params.slug }] },
    });
    if (!post) return apiError('Post not found', 404);

    await prisma.blogPost.delete({ where: { id: post.id } });
    await invalidateCache('blog:*');

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'blog-delete');
  }
}
