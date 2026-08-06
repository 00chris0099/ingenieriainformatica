import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { pageStore } from '@/lib/pageStore';
import { ensureDefaultBusiness, DEFAULT_BUSINESS_ID } from '@/lib/business';

function syntheticPage(id: string): any {
  return {
    id,
    title: 'Nueva Página',
    slug: id.replace('page-', 'pagina-'),
    type: 'landing',
    status: 'draft',
    description: null,
    businessId: DEFAULT_BUSINESS_ID,
    blocks: [],
    seo: {},
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  if (pageStore.has(id)) {
    return apiSuccess(pageStore.get(id));
  }

  try {
    const page = await prisma.page.findUnique({ where: { id } });
    if (page) {
      pageStore.set(id, page);
      return apiSuccess(page);
    }
  } catch (e) {
    console.warn(`[PAGE GET ${id}] DB error:`, (e as any)?.message?.slice(0, 80));
  }

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

    const current = pageStore.get(id) || syntheticPage(id);
    const updated = { ...current, ...data };
    pageStore.set(id, updated);

    try {
      let dbPage: any;
      const existing = await prisma.page.findUnique({ where: { id } });

      if (existing) {
        if (status === 'published' && existing.status !== 'published') {
          data.publishedAt = new Date();
        }
        dbPage = await prisma.page.update({ where: { id }, data });
      } else {
        const targetBizId = await ensureDefaultBusiness();
        dbPage = await prisma.page.create({
          data: {
            id: id.length === 36 ? id : undefined, // only pass ID if valid UUID
            title: updated.title,
            slug: updated.slug,
            type: updated.type || 'landing',
            status: updated.status || 'draft',
            description: updated.description,
            businessId: targetBizId,
            blocks: blocks || updated.blocks || [],
            seo: seo || updated.seo || {},
            settings: settings || updated.settings || {},
          },
        });
      }

      pageStore.set(id, dbPage);
      return apiSuccess(dbPage);
    } catch (dbErr) {
      console.warn(`[PAGE PUT ${id}] DB error, returning store version:`, (dbErr as any)?.message?.slice(0, 100));
      return apiSuccess(updated);
    }
  } catch (error) {
    console.error(`[PAGE PUT ${id}] Error:`, error);
    return apiError('Error al actualizar página', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  pageStore.delete(id);

  try {
    await prisma.page.delete({ where: { id } });
  } catch (e) {
    console.warn(`[PAGE DELETE ${id}] DB delete failed:`, (e as any)?.message?.slice(0, 80));
  }

  return apiSuccess({ deleted: true });
}
