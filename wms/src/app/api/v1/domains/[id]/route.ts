import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';

declare global {
  // eslint-disable-next-line no-var
  var __domainStore: Map<string, any>;
}

const domainStore = global.__domainStore || new Map();

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const updatedRecord = {
      status: 'verified',
      sslStatus: 'active',
      verifiedAt: new Date().toISOString(),
    };

    if (domainStore.has(id)) {
      const existing = domainStore.get(id);
      domainStore.set(id, { ...existing, ...updatedRecord });
    }

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const dbUpdated = await prisma.customDomain.update({
          where: { id },
          data: {
            status: 'verified',
            sslStatus: 'active',
            verifiedAt: new Date(),
          },
        });
        domainStore.set(id, dbUpdated);
        return apiSuccess(dbUpdated);
      }
    } catch (e) {
      console.warn(`[DOMAINS VERIFY ${id}] DB update error:`, (e as any)?.message?.slice(0, 80));
    }

    return apiSuccess(domainStore.get(id) || { id, ...updatedRecord });
  } catch (error) {
    return apiError('Error al verificar dominio', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  domainStore.delete(id);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      await prisma.customDomain.delete({ where: { id } });
    }
  } catch (e) {
    console.warn(`[DOMAINS DELETE ${id}] DB delete error:`, (e as any)?.message?.slice(0, 80));
  }

  return apiSuccess({ deleted: true });
}
