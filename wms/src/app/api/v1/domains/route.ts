import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { ensureDefaultBusiness } from '@/lib/business';
import crypto from 'crypto';

// In-process memory store for custom domains
declare global {
  // eslint-disable-next-line no-var
  var __domainStore: Map<string, any>;
}

if (!global.__domainStore) {
  global.__domainStore = new Map();
  // Default demo domain
  global.__domainStore.set('dom-default-1', {
    id: 'dom-default-1',
    domain: 'adriskids.com',
    status: 'verified',
    sslStatus: 'active',
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    targetIp: '187.77.57.116',
    cnameTarget: 'cname.easypanel.host',
  });
}

const domainStore = global.__domainStore;

function cleanDomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
}

export async function GET() {
  try {
    let dbDomains: any[] = [];
    try {
      dbDomains = await prisma.customDomain.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.warn('[DOMAINS GET] DB error, using in-process store:', (e as any)?.message?.slice(0, 80));
    }

    const dbIds = new Set(dbDomains.map(d => d.id));
    const storeDomains = Array.from(domainStore.values()).filter(d => !dbIds.has(d.id));

    const combined = [...storeDomains, ...dbDomains].map(d => ({
      ...d,
      targetIp: '187.77.57.116',
      cnameTarget: 'aimachristian-tiendawms.ajcxjb.easypanel.host',
    }));

    return apiSuccess(combined);
  } catch (error) {
    return apiSuccess(Array.from(domainStore.values()));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain: rawDomain } = body;

    if (!rawDomain) return apiError('El nombre de dominio es requerido', 400);

    const domain = cleanDomain(rawDomain);
    if (!domain || !domain.includes('.')) {
      return apiError('Ingresa un nombre de dominio válido (Ej: mitienda.com)', 400);
    }

    const targetBusinessId = await ensureDefaultBusiness();

    // Check duplication in memory store
    const duplicate = Array.from(domainStore.values()).find(d => d.domain === domain);
    if (duplicate) {
      return apiError('Este dominio ya se encuentra registrado', 400);
    }

    const newDomainId = crypto.randomUUID();
    const domainRecord = {
      id: newDomainId,
      businessId: targetBusinessId,
      domain,
      status: 'pending',
      sslStatus: 'issuing',
      verifiedAt: null,
      createdAt: new Date().toISOString(),
      targetIp: '187.77.57.116',
      cnameTarget: 'aimachristian-tiendawms.ajcxjb.easypanel.host',
    };

    try {
      const created = await prisma.customDomain.create({
        data: {
          id: newDomainId,
          businessId: targetBusinessId,
          domain,
          status: 'pending',
          sslStatus: 'issuing',
        },
      });
      domainStore.set(created.id, created);
      return apiSuccess(created, 201);
    } catch (dbErr) {
      console.warn('[DOMAINS POST] DB create error, storing in-process:', (dbErr as any)?.message?.slice(0, 100));
    }

    domainStore.set(newDomainId, domainRecord);
    return apiSuccess(domainRecord, 201);
  } catch (error) {
    return apiError('Error al agregar dominio personalizado', 500);
  }
}
