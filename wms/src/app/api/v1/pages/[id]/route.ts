import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { pageStore } from '@/lib/pageStore';

function syntheticPage(id: string): any {
  return {
    id,
    title: 'Nueva Página',
    slug: id.replace('page-', 'pagina-'),
    type: 'landing',
    status: 'draft',
    description: null,
    businessId: 'agency-vps-default',
    blocks: [],
    seo: {},
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // 1. Check in-process store first (fastest, always works)
  if (pageStore.has(id)) {
    return apiSuccess(pageStore.get(id));
  }

  // 2. Try DB
  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (page) {
      // Cache in store
      pageStore.set(id, page);
      return apiSuccess(page);
    }
  } catch (e) {
    console.warn(`[PAGE GET ${id}] DB unreachable:`, (e as any)?.message?.slice(0, 80));
  }

  // 3. If ID looks like a fallback temp id, return synthetic empty page
  //    so the builder can still open and save content
  if (id.startsWith('page-') || id.length < 36) {
    console.warn(`[PAGE GET ${id}] Not found in DB/store — returning synthetic blank page`);
    const synthetic = syntheticPage(id);
    pageStore.set(id, synthetic);
    return apiSuccess(synthetic);
  }

  return apiError('Página no encontrada', 404);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { title, slug, description, type, status, blocks, seo, settings, templateId } = body;

    // Build update payload
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (blocks !== undefined) data.blocks = blocks;
    if (seo !== undefined) data.seo = seo;
    if (settings !== undefined) data.settings = settings;
    if (templateId !== undefined) data.templateId = templateId;
    data.updatedAt = new Date();

    // Update in-process store immediately
    const current = pageStore.get(id) || syntheticPage(id);
    const updated = { ...current, ...data };
    pageStore.set(id, updated);

    // Try DB update/create
    try {
      let dbPage: any;
      const existing = await prisma.page.findUnique({ where: { id } });

      if (existing) {
        if (status === 'published' && existing.status !== 'published') {
          data.publishedAt = new Date();
        }
        dbPage = await prisma.page.update({ where: { id }, data });

        // Save version if blocks changed
        if (blocks !== undefined) {
          try {
            const lastVersion = await prisma.pageVersion.findFirst({
              where: { pageId: id }, orderBy: { version: 'desc' },
            });
            const nextVersion = (lastVersion?.version || 0) + 1;
            await prisma.pageVersion.create({
              data: {
                pageId: id, version: nextVersion,
                snapshot: { title: dbPage.title, blocks, seo, settings },
                diff: { changes: [`${(blocks as any[]).length} blocks`] },
                authorId: 'system',
              },
            });
          } catch { /* version save not critical */ }
        }
      } else {
        // Page exists only in store — create it in DB now
        dbPage = await prisma.page.create({
          data: {
            id,
            title: updated.title,
            slug: updated.slug,
            type: updated.type || 'landing',
            status: updated.status || 'draft',
            description: updated.description,
            businessId: updated.businessId || 'agency-vps-default',
            blocks: blocks || updated.blocks || [],
            seo: seo || updated.seo || {},
            settings: settings || updated.settings || {},
          },
        });
      }

      // Sync store with DB result
      pageStore.set(id, dbPage);
      return apiSuccess(dbPage);
    } catch (dbErr) {
      console.warn(`[PAGE PUT ${id}] DB failed, returning store version:`, (dbErr as any)?.message?.slice(0, 80));
      return apiSuccess(updated);
    }
  } catch (error) {
    console.error(`[PAGE PUT ${id}] Critical error:`, error);
    return apiError('Error al actualizar página', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Remove from store
  pageStore.delete(id);

  // Try DB delete
  try {
    await prisma.page.delete({ where: { id } });
  } catch (e) {
    console.warn(`[PAGE DELETE ${id}] DB delete failed (may not exist in DB):`, (e as any)?.message?.slice(0, 80));
  }

  return apiSuccess({ deleted: true });
}
