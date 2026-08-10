import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, apiError } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope, belongsToScope } from '@/lib/api/business-access';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];

async function findLeadOwned(id: string, user: any) {
  const scope = await getBusinessScope(user);
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { error: apiError('Lead no encontrado', 404) };
  if (!belongsToScope(lead.businessId, scope)) {
    return { error: apiError('Forbidden: el lead no pertenece a tus tiendas', 403) };
  }
  return { lead };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const { id } = await params;
    const owned = await findLeadOwned(id, user);
    if (owned.error) return owned.error;
    const lead = owned.lead!;

    const body = await request.json().catch(() => null);
    if (!body) return apiError('Body JSON inválido', 400);

    const data: any = {};
    if (body.status !== undefined) {
      const st = String(body.status);
      if (!LEAD_STATUSES.includes(st)) return apiError(`Estado inválido: ${st}`, 400);
      data.status = st;
    }
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) return apiError('tags debe ser un arreglo', 400);
      data.tags = body.tags.map((t: any) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 12);
    }
    if (body.notes !== undefined) data.notes = String(body.notes || '').slice(0, 3000) || null;
    if (body.fullName !== undefined) data.fullName = String(body.fullName || '').slice(0, 200);
    if (body.email !== undefined) data.email = String(body.email || '').trim().toLowerCase() || null;
    if (body.phone !== undefined) data.phone = String(body.phone || '').trim() || null;

    // Convertir a cliente real (opcional): crea el Customer y lo enlaza
    if (body.convertToCustomer === true && !lead.convertedCustomerId) {
      const customer = await prisma.customer.create({
        data: {
          source: 'lead',
          fullName: body.fullName || lead.fullName,
          email: (body.email || lead.email) || null,
          phone: (body.phone || lead.phone) || null,
        },
      });
      data.convertedCustomerId = customer.id;
    }

    const updated = await prisma.lead.update({ where: { id }, data });

    return apiSuccess({
      id: updated.id,
      status: updated.status,
      tags: updated.tags,
      notes: updated.notes,
      convertedCustomerId: updated.convertedCustomerId,
    });
  } catch (error) {
    console.error('[leads PATCH]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al actualizar el lead', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;

    const { id } = await params;
    const owned = await findLeadOwned(id, user);
    if (owned.error) return owned.error;

    await prisma.lead.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error('[leads DELETE]', (error as Error)?.message?.slice(0, 300));
    return apiError('Error al eliminar el lead', 500);
  }
}
