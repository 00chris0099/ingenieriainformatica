import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, apiSuccess } from '@/lib/api';
import { pageStore } from '@/lib/pageStore';
import { ensureDefaultBusiness, DEFAULT_BUSINESS_ID } from '@/lib/business';
import crypto from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (pageStore.has(id)) {
    return apiSuccess(pageStore.get(id));
  }

  try {
    let page: any = null;
    if (isUuid(id)) {
      page = await prisma.page.findUnique({ where: { id } });
    } else {
      page = await prisma.page.findFirst({ where: { slug: id } });
    }

    if (page) {
      pageStore.set(page.id, page);
      return apiSuccess(page);
    }
  } catch (e) {
    console.warn(`[PAGE GET ${id}] DB error:`, (e as any)?.message?.slice(0, 80));
  }

  const synthetic = syntheticPage(id);
  pageStore.set(id, synthetic);
  return apiSuccess(synthetic);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
    if (templateId !== undefined && isUuid(templateId)) data.templateId = templateId;
    data.updatedAt = new Date();

    const current = pageStore.get(id) || syntheticPage(id);
    const updated = { ...current, ...data };
    pageStore.set(id, updated);

    try {
      let dbPage: any;
      let existing: any = null;

      if (isUuid(id)) {
        existing = await prisma.page.findUnique({ where: { id } });
      }

      if (existing) {
        if (status === 'published' && existing.status !== 'published') {
          data.publishedAt = new Date();
        }
        dbPage = await prisma.page.update({ where: { id }, data });
      } else {
        const targetBizId = await ensureDefaultBusiness();
        dbPage = await prisma.page.create({
          data: {
            id: isUuid(id) ? id : crypto.randomUUID(),
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

      pageStore.set(dbPage.id, dbPage);
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  pageStore.delete(id);

  try {
    if (isUuid(id)) {
      await prisma.page.delete({ where: { id } });
    } else {
      await prisma.page.deleteMany({ where: { slug: id } });
    }
  } catch (e) {
    console.warn(`[PAGE DELETE ${id}] DB delete failed:`, (e as any)?.message?.slice(0, 80));
  }

  return apiSuccess({ deleted: true });
}
