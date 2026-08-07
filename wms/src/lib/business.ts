import { prisma } from '@repo/prisma';

export const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

export async function ensureDefaultBusiness(): Promise<string> {
  try {
    // 1. Check if ANY business already exists in the database
    const existing = await prisma.business.findFirst();
    if (existing) {
      return existing.id;
    }

    // 2. If no business exists, create default business using upsert
    const created = await prisma.business.upsert({
      where: { id: DEFAULT_BUSINESS_ID },
      update: {},
      create: {
        id: DEFAULT_BUSINESS_ID,
        name: 'Agencia VPS Default',
        slug: `agencia-vps-${Date.now()}`,
        industry: 'general',
        subdomain: `vps-store-${Date.now()}`,
        primaryColor: '#2563eb',
        secondaryColor: '#7c3aed',
        accentColor: '#f59e0b',
      },
    });

    return created.id;
  } catch (e) {
    console.warn('[BUSINESS ENSURE ERROR]', e);
    // Ultimate fallback try
    try {
      const anyBiz = await prisma.business.findFirst();
      if (anyBiz) return anyBiz.id;
    } catch {}
    return DEFAULT_BUSINESS_ID;
  }
}
