import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { id } = params;
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) return apiError('Page not found', 404);
    return apiSuccess(page);
  } catch (error) {
    return handleApiError(error, 'page-get');
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { id } = params;
    const body = await request.json();
    const { title, slug, description, type, status, blocks, seo, settings, templateId } = body;

    const existing = await prisma.page.findUnique({ where: { id } });
    if (!existing) return apiError('Page not found', 404);

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (status !== undefined) {
      data.status = status;
      if (status === 'published' && existing.status !== 'published') {
        data.publishedAt = new Date();
      }
    }
    if (blocks !== undefined) data.blocks = blocks;
    if (seo !== undefined) data.seo = seo;
    if (settings !== undefined) data.settings = settings;
    if (templateId !== undefined) data.templateId = templateId;

    const updated = await prisma.page.update({ where: { id }, data });

    // Create version snapshot if blocks changed
    if (blocks !== undefined) {
      const lastVersion = await prisma.pageVersion.findFirst({
        where: { pageId: id },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (lastVersion?.version || 0) + 1;

      // Calculate diff
      const oldBlocks = existing.blocks as any[];
      const newBlocks = blocks as any[];
      const changes: string[] = [];
      if (JSON.stringify(oldBlocks) !== JSON.stringify(newBlocks)) {
        changes.push(`${newBlocks.length} blocks`);
      }

      await prisma.pageVersion.create({
        data: {
          pageId: id,
          version: nextVersion,
          snapshot: { title: updated.title, blocks, seo, settings },
          diff: changes.length > 0 ? { changes } : undefined,
          authorId: (authCheck.user as any).id,
        },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error, 'page-update');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const userRole = (authCheck.user as any).role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      return apiError('Admin access required to delete pages', 403);
    }

    const { id } = params;
    const existing = await prisma.page.findUnique({ where: { id } });
    if (!existing) return apiError('Page not found', 404);

    await prisma.page.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error, 'page-delete');
  }
}
