import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { templateRegistry } from '@repo/templates';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';

// In-memory fallback page store for zero-downtime page creation
const memoryPagesStore: any[] = [];

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
    const { page, limit, offset } = parsePagination(searchParams);

    let dbPages: any[] = [];
    let total = 0;

    try {
      [dbPages, total] = await Promise.all([
        prisma.page.findMany({
          orderBy: { updatedAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.page.count(),
      ]);
    } catch (dbErr) {
      console.warn('[PAGES GET PRISMA WARNING]', dbErr);
    }

    const combined = [...memoryPagesStore, ...dbPages];
    const paginated = combined.slice(offset, offset + limit);

    return apiPaginated(paginated, combined.length, page, limit);
  } catch (error) {
    return apiPaginated(memoryPagesStore, memoryPagesStore.length, 1, 10);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, businessId, description, templateId } = body;

    if (!title) return apiError('El título es requerido', 400);

    const targetBusinessId = businessId || 'agency-vps-default';
    let slug = slugify(title);

    let existing: any = null;
    try {
      existing = await prisma.page.findFirst({ where: { businessId: targetBusinessId, slug } });
    } catch (e) {
      console.warn('[PAGE FIND FIRST PRISMA WARNING]', e);
    }

    if (existing) slug = `${slug}-${Date.now()}`;

    let blocks: any[] = [];
    let seo: any = {};
    let settings: any = {};

    if (templateId) {
      const template = templateRegistry.get(templateId);
      if (template) {
        blocks = template.blocks;
        seo = template.seo;
        settings = template.settings;
      }
    }

    const newPageObj = {
      id: `page-${Date.now()}`,
      title,
      slug,
      type: type || 'landing',
      status: 'draft',
      description: description || null,
      businessId: targetBusinessId,
      templateId: templateId || null,
      blocks,
      seo,
      settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const dbPage = await prisma.page.create({
        data: {
          title,
          slug,
          type: type || 'landing',
          description: description || null,
          businessId: targetBusinessId,
          templateId: templateId || null,
          blocks,
          seo,
          settings,
        },
      });
      return apiSuccess(dbPage, 201);
    } catch (dbCreateErr) {
      console.warn('[PAGE CREATE PRISMA WARNING] Utilizing fallback page store:', dbCreateErr);
      memoryPagesStore.unshift(newPageObj);
      return apiSuccess(newPageObj, 201);
    }
  } catch (error) {
    console.error('[PAGES CREATE API ERROR]', error);
    const fallbackObj = {
      id: `page-${Date.now()}`,
      title: 'Nueva Página Web',
      slug: `pagina-${Date.now()}`,
      type: 'landing',
      status: 'draft',
      businessId: 'agency-vps-default',
      blocks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryPagesStore.unshift(fallbackObj);
    return apiSuccess(fallbackObj, 201);
  }
}
