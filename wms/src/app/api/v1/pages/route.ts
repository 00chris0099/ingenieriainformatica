import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam } from '@/lib/api';
import { pageStore } from '@/lib/pageStore';
import { ensureDefaultBusiness, DEFAULT_BUSINESS_ID } from '@/lib/business';
import crypto from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(str: string): boolean {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function makeFallbackPage(overrides: any = {}): any {
  const id = (overrides.id && isUuid(overrides.id)) ? overrides.id : crypto.randomUUID();
  const title = overrides.title || 'Nueva Página Web';
  return {
    id,
    title,
    slug: overrides.slug || slugify(title),
    type: overrides.type || 'landing',
    status: 'draft',
    description: overrides.description || null,
    businessId: DEFAULT_BUSINESS_ID,
    templateId: overrides.templateId || null,
    blocks: overrides.blocks || [],
    seo: overrides.seo || {},
    settings: overrides.settings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    let dbPages: any[] = [];
    let dbTotal = 0;

    try {
      [dbPages, dbTotal] = await Promise.all([
        prisma.page.findMany({ orderBy: { updatedAt: 'desc' }, skip: offset, take: limit }),
        prisma.page.count(),
      ]);
    } catch (e) {
      console.warn('[PAGES GET] DB error/unreachable, using in-process store:', (e as any)?.message?.slice(0, 80));
    }

    const dbIds = new Set(dbPages.map((p: any) => p.id));
    const storePages = Array.from(pageStore.values()).filter(p => !dbIds.has(p.id));

    const combined = [...storePages, ...dbPages].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const paginated = combined.slice(offset, offset + limit);
    return apiPaginated(paginated, combined.length, page, limit);
  } catch (error) {
    const all = Array.from(pageStore.values());
    return apiPaginated(all, all.length, 1, 100);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, businessId, description, templateId } = body;

    if (!title) return apiError('El título es requerido', 400);

    let slug = slugify(title);

    // Ensure valid business UUID
    let targetBusinessId = businessId;
    if (!targetBusinessId || targetBusinessId === 'agency-vps-default' || !isUuid(targetBusinessId)) {
      targetBusinessId = await ensureDefaultBusiness();
    }

    // Handle slug uniqueness in store
    const existingSlug = Array.from(pageStore.values()).find(
      p => p.slug === slug && p.businessId === targetBusinessId
    );
    if (existingSlug) slug = `${slug}-${Date.now()}`;

    let blocks: any[] = [];
    let seo: any = {};
    let settings: any = {};

    if (templateId) {
      try {
        const { templateRegistry } = await import('@repo/templates');
        const template = templateRegistry.get(templateId);
        if (template) {
          blocks = template.blocks as any[];
          seo = template.seo;
          settings = template.settings;
        }
      } catch { /* template registry unavailable */ }
    }

    // Try DB first with valid UUID fields only
    try {
      let dbSlug = slug;
      const existing = await prisma.page.findFirst({ where: { businessId: targetBusinessId, slug: dbSlug } });
      if (existing) dbSlug = `${dbSlug}-${Date.now()}`;

      // Only pass templateId to Prisma if it is a valid UUID
      const validTemplateId = (templateId && isUuid(templateId)) ? templateId : null;

      const page = await prisma.page.create({
        data: {
          title, slug: dbSlug, type: type || 'landing',
          description: description || null,
          businessId: targetBusinessId,
          templateId: validTemplateId,
          blocks, seo, settings,
        },
      });

      pageStore.set(page.id, { ...page, blocks, seo, settings });
      console.log(`[PAGES POST] Created in DB: ${page.id}`);
      return apiSuccess(page, 201);
    } catch (dbErr) {
      console.warn('[PAGES POST] DB error, using in-process store:', (dbErr as any)?.message?.slice(0, 100));
    }

    // In-process store fallback
    const fallback = makeFallbackPage({ title, type, description, slug, templateId, blocks, seo, settings });
    pageStore.set(fallback.id, fallback);
    console.log(`[PAGES POST FALLBACK] Stored in-process: ${fallback.id}`);
    return apiSuccess(fallback, 201);
  } catch (error) {
    console.error('[PAGES POST ERROR]', error);
    const emergency = makeFallbackPage();
    pageStore.set(emergency.id, emergency);
    return apiSuccess(emergency, 201);
  }
}
