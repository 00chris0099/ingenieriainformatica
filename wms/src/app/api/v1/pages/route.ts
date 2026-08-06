import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { templateRegistry } from '@repo/templates';
import { apiPaginated, apiError, apiSuccess, parsePagination, getSearchParam, handleApiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const type = getSearchParam(searchParams, 'type');
    const businessId = getSearchParam(searchParams, 'businessId');
    const { page, limit, offset } = parsePagination(searchParams);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (businessId) where.businessId = businessId;

    const result = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const total = await prisma.page.count({ where });

    return apiPaginated(result, total, page, limit);
  } catch (error) {
    return handleApiError(error, 'pages-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const body = await request.json();
    const { title, type, businessId, description, templateId } = body;

    if (!title) return apiError('title is required', 400);
    if (!businessId) return apiError('businessId is required', 400);

    let slug = slugify(title);
    const existing = await prisma.page.findFirst({ where: { businessId, slug } });
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

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        type: type || 'landing',
        description: description || null,
        businessId,
        templateId: templateId || null,
        blocks,
        seo,
        settings,
      },
    });

    return apiSuccess(page, 201);
  } catch (error) {
    return handleApiError(error, 'pages-create');
  }
}
