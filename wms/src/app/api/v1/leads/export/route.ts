import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiError, getSearchParam } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-guard';
import { getBusinessScope } from '@/lib/api/business-access';

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth();
    if (authCheck.error) return authCheck.error;
    const user = authCheck.user as any;
    const scope = await getBusinessScope(user);

    const { searchParams } = new URL(request.url);
    const status = getSearchParam(searchParams, 'status');
    const q = getSearchParam(searchParams, 'q');
    const businessId = getSearchParam(searchParams, 'businessId');

    const where: any = {};
    if (!scope.isStaff) where.businessId = { in: scope.ids };
    else if (businessId) where.businessId = businessId;
    if (status && status !== 'all') where.status = status;
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { page: { select: { title: true } }, business: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const header = ['Fecha', 'Nombre', 'Email', 'Teléfono', 'Mensaje', 'Estado', 'Etiquetas', 'Fuente', 'Página', 'Tienda'];
    const rows = leads.map((l) => [
      l.createdAt.toISOString(),
      l.fullName,
      l.email,
      l.phone,
      l.message,
      l.status,
      l.tags.join(' | '),
      l.source,
      l.page?.title,
      l.business?.name,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');

    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('[leads export]', (error as Error)?.message?.slice(0, 200));
    return apiError('Error al exportar leads', 500);
  }
}
