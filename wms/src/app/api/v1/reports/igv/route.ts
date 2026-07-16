import { NextRequest } from 'next/server';
import { prisma } from '@repo/prisma';
import { apiSuccess, handleApiError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const thisMonthInvoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: startOfMonth }, status: { not: 'cancelled' } },
      select: { subtotal: true, taxAmount: true, total: true },
    });

    const thisYearInvoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: startOfYear }, status: { not: 'cancelled' } },
      select: { subtotal: true, taxAmount: true, total: true },
    });

    const igvThisMonth = thisMonthInvoices.reduce((sum, i) => sum + Number(i.taxAmount), 0);
    const igvThisYear = thisYearInvoices.reduce((sum, i) => sum + Number(i.taxAmount), 0);
    const totalTaxable = thisYearInvoices.reduce((sum, i) => sum + Number(i.subtotal), 0);

    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);

      const invoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: d, lt: end }, status: { not: 'cancelled' } },
        select: { subtotal: true, taxAmount: true, total: true },
      });

      monthly.push({
        month: d.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }),
        base: invoices.reduce((sum, i) => sum + Number(i.subtotal), 0).toFixed(2),
        igv: invoices.reduce((sum, i) => sum + Number(i.taxAmount), 0).toFixed(2),
        total: invoices.reduce((sum, i) => sum + Number(i.total), 0).toFixed(2),
      });
    }

    return apiSuccess({
      igvThisMonth: igvThisMonth.toFixed(2),
      igvThisYear: igvThisYear.toFixed(2),
      totalTaxable: totalTaxable.toFixed(2),
      monthly,
    });
  } catch (error) {
    return handleApiError(error, 'report-igv');
  }
}
