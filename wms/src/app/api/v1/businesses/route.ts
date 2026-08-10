import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/api';
import { requireAuth, requireRole } from '@/lib/api/auth-guard';
import { sanitizeBusinessSettings } from '@/lib/payments/checkout';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

const PAGE_SELECT = {
  select: { id: true, title: true, slug: true, type: true, status: true, updatedAt: true },
} as const;

export async function GET() {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;

    const user = authCheck.user as any;
    const role = user.role as string;
    const isStaff = role === 'super_admin' || role === 'admin';

    if (isStaff) {
      // Admin / Super Admin: ver todas las tiendas con conteo de usuarios asignados y páginas
      const businesses = await prisma.business.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          pages: PAGE_SELECT,
          _count: { select: { pages: true, assignedUsers: true } },
        },
      });
      // Nunca exponer tokens de pago en crudo al navegador
      return apiSuccess(businesses.map((b) => ({ ...b, settings: sanitizeBusinessSettings(b.settings) })));
    }

    // Cliente: solo sus tiendas asignadas (puede tener varias)
    const assignments = await prisma.userBusiness.findMany({
      where: { userId: (user as any).id },
      include: {
        business: {
          include: {
            pages: PAGE_SELECT,
            _count: { select: { pages: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(
      assignments.map((a) => ({
        ...a.business,
        settings: sanitizeBusinessSettings(a.business.settings),
        assignedRole: a.role,
        assignedAt: a.createdAt,
      }))
    );
  } catch (error) {
    return handleApiError(error, 'businesses-list');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireRole('super_admin', 'admin');
    if (authCheck.error) return authCheck.error;

    const body = await request.json();
    const { name, industry } = body;
    if (!name || !industry) {
      return apiError('name and industry are required', 400);
    }

    const baseSlug = slugify(name) || `tienda-${Date.now()}`;
    let slug = baseSlug;
    let subdomain = baseSlug;
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    counter = 1;
    while (await prisma.business.findUnique({ where: { subdomain } })) {
      subdomain = `${baseSlug}-${counter++}`;
    }

    const business = await prisma.business.create({
      data: { name, slug, industry, subdomain },
    });

    return apiSuccess(business, 201);
  } catch (error) {
    return handleApiError(error, 'business-create');
  }
}
