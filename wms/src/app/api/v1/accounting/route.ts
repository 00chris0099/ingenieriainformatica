import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@repo/prisma';

/**
 * GET - Get accounting/billing status and config
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nubefactConfigured = !!(process.env.NUBEFACT_TOKEN && process.env.NUBEFACT_URL);

    // Get invoice stats
    const totalInvoices = await prisma.invoice.count();
    const pendingInvoices = await prisma.invoice.count({ where: { status: 'draft' } });
    const paidInvoices = await prisma.invoice.count({ where: { status: 'paid' } });

    return NextResponse.json({
      data: {
        nubefact: {
          configured: nubefactConfigured,
          url: process.env.NUBEFACT_URL || 'No configurado',
        },
        stats: {
          total: totalInvoices,
          pending: pendingInvoices,
          paid: paidInvoices,
        },
        documentTypes: [
          { id: 'FACTURA', name: 'Factura Electronica', code: '01' },
          { id: 'BOLETA', name: 'Boleta de Venta', code: '03' },
          { id: 'NOTA_CREDITO', name: 'Nota de Credito', code: '07' },
          { id: 'NOTA_DEBITO', name: 'Nota de Debito', code: '08' },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching accounting config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
