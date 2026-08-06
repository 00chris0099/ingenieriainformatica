import { prisma } from '@repo/prisma';

export const DEFAULT_BUSINESS_ID = '00000000-0000-0000-0000-000000000001';

export async function ensureDefaultBusiness(): Promise<string> {
  try {
    let biz = await prisma.business.findUnique({
      where: { id: DEFAULT_BUSINESS_ID },
    });

    if (!biz) {
      biz = await prisma.business.create({
        data: {
          id: DEFAULT_BUSINESS_ID,
          name: 'Agencia VPS Default',
          slug: 'agencia-vps-default',
          industry: 'general',
          subdomain: 'main-vps-store',
          primaryColor: '#2563eb',
          secondaryColor: '#7c3aed',
          accentColor: '#f59e0b',
        },
      });
    }

    return biz.id;
  } catch (e) {
    console.warn('[BUSINESS ENSURE WARNING]', e);
    // If DB fails, try finding any existing business
    try {
      const first = await prisma.business.findFirst();
      if (first) return first.id;
    } catch {}
    return DEFAULT_BUSINESS_ID;
  }
}
